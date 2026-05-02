import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { login } from '@/lib/auth'
import { asTrimmedString, isValidEmail } from '@/lib/validators'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRequestId, logError, logInfo } from '@/lib/logger'
import { generateOtp, hashOtp, isOtpExpired } from '@/lib/otp'
import { sendEmail } from '@/lib/email/smtp'
import { loginOtpTemplate } from '@/lib/email/templates'
import { sendOperationalAlert } from '@/lib/alerts'

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const limiter = checkRateLimit({ key: `auth-login:${ip}`, limit: 10, windowMs: 60_000 })
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
    }

    const body = await req.json()
    const email = asTrimmedString(body.email).toLowerCase()
    const password = asTrimmedString(body.password)
    const otp = asTrimmedString(body.otp)

    if (!isValidEmail(email) || password.length < 8) {
      return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    const matches = await compare(password, existingUser.password)

    if (!matches) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
    }

    if (existingUser.role === 'RECRUITER' && !existingUser.emailVerified) {
      if (!otp) {
        const generatedOtp = generateOtp()
        const otpHash = hashOtp(generatedOtp)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
        await prisma.emailOtp.upsert({
          where: { email_purpose: { email, purpose: 'LOGIN_VERIFY' } },
          update: { otpHash, expiresAt, attempts: 0 },
          create: { email, purpose: 'LOGIN_VERIFY', otpHash, expiresAt, attempts: 0 },
        })
        const otpEmail = loginOtpTemplate(generatedOtp)
        const sent = await sendEmail({ to: email, subject: otpEmail.subject, html: otpEmail.html, text: otpEmail.text })
        if (!sent.sent) {
          void sendOperationalAlert('OTP delivery failure', `Route: /api/auth/login\nRequestId: ${requestId}\nEmail: ${email}\nReason: ${sent.reason || 'unknown'}`)
          return NextResponse.json({
            error: sent.reason ? `OTP email delivery failed: ${sent.reason}` : 'OTP email delivery failed.',
            requestId,
          }, { status: 500 })
        }
        return NextResponse.json({
          message: 'OTP sent. Enter OTP to complete recruiter login.',
          otpRequired: true,
          requestId,
        })
      }

      const pending = await prisma.emailOtp.findUnique({
        where: { email_purpose: { email, purpose: 'LOGIN_VERIFY' } },
      })

      if (!pending || isOtpExpired(pending.expiresAt)) {
        return NextResponse.json({ error: 'OTP expired. Request login OTP again.' }, { status: 400 })
      }
      if (pending.attempts >= 5) {
        return NextResponse.json({ error: 'Too many invalid OTP attempts.' }, { status: 429 })
      }
      if (pending.otpHash !== hashOtp(otp)) {
        await prisma.emailOtp.update({
          where: { email_purpose: { email, purpose: 'LOGIN_VERIFY' } },
          data: { attempts: { increment: 1 } },
        })
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
      }

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: true },
      })
      await prisma.emailOtp.delete({
        where: { email_purpose: { email, purpose: 'LOGIN_VERIFY' } },
      }).catch(() => null)
    }

    // Create session
    await login({ 
      id: existingUser.id, 
      email: existingUser.email, 
      role: existingUser.role,
      isOnboarded: existingUser.isOnboarded 
    })

    logInfo('User login successful', { route: '/api/auth/login', requestId, userId: existingUser.id })
    return NextResponse.json({ 
      message: 'Logged in', 
      role: existingUser.role,
      isOnboarded: existingUser.isOnboarded,
      requestId
    })
  } catch (err: any) {
    logError('Login route failed', { route: '/api/auth/login', requestId }, err)
    return NextResponse.json({ error: err.message, requestId }, { status: 500 })
  }
}
