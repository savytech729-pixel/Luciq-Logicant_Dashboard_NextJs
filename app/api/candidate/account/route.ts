import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { compare, hash } from 'bcryptjs'
import { generateOtp, hashOtp, isOtpExpired } from '@/lib/otp'
import { sendEmail } from '@/lib/email/smtp'
import { loginOtpTemplate } from '@/lib/email/templates'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const action = String(body?.action || '')

    const user = await prisma.user.findUnique({ where: { id: session.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (action === 'change-password') {
      const currentPassword = String(body?.currentPassword || '')
      const newPassword = String(body?.newPassword || '')
      if (!currentPassword || !newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: 'Invalid password payload' }, { status: 400 })
      }
      const valid = await compare(currentPassword, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      const nextHash = await hash(newPassword, 10)
      await prisma.user.update({ where: { id: user.id }, data: { password: nextHash } })
      return NextResponse.json({ ok: true, message: 'Password updated successfully' })
    }

    if (action === 'send-reset-otp') {
      const otp = generateOtp()
      const otpHash = hashOtp(otp)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await prisma.emailOtp.upsert({
        where: { email_purpose: { email: user.email, purpose: 'PASSWORD_RESET' } },
        update: { otpHash, expiresAt, attempts: 0, passwordHash: null, role: null },
        create: { email: user.email, purpose: 'PASSWORD_RESET', otpHash, expiresAt, attempts: 0 },
      })
      const otpEmail = loginOtpTemplate(otp)
      const sent = await sendEmail({ to: user.email, subject: otpEmail.subject, html: otpEmail.html, text: otpEmail.text })
      if (!sent.sent) {
        return NextResponse.json({ error: sent.reason || 'Failed to send OTP' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, message: 'Reset OTP sent to your email' })
    }

    if (action === 'reset-password-with-otp') {
      const otp = String(body?.otp || '')
      const newPassword = String(body?.newPassword || '')
      if (!otp || !newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: 'Invalid reset payload' }, { status: 400 })
      }
      const pending = await prisma.emailOtp.findUnique({
        where: { email_purpose: { email: user.email, purpose: 'PASSWORD_RESET' } },
      })
      if (!pending || isOtpExpired(pending.expiresAt)) {
        return NextResponse.json({ error: 'OTP expired. Request a new one.' }, { status: 400 })
      }
      if (pending.attempts >= 5) {
        return NextResponse.json({ error: 'Too many invalid OTP attempts.' }, { status: 429 })
      }
      if (pending.otpHash !== hashOtp(otp)) {
        await prisma.emailOtp.update({
          where: { email_purpose: { email: user.email, purpose: 'PASSWORD_RESET' } },
          data: { attempts: { increment: 1 } },
        })
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
      }
      const nextHash = await hash(newPassword, 10)
      await prisma.user.update({ where: { id: user.id }, data: { password: nextHash } })
      await prisma.emailOtp.delete({
        where: { email_purpose: { email: user.email, purpose: 'PASSWORD_RESET' } },
      }).catch(() => null)
      return NextResponse.json({ ok: true, message: 'Password reset successfully' })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
