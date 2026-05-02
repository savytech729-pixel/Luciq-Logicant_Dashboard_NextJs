import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { login } from '@/lib/auth'
import { asTrimmedString, isValidEmail } from '@/lib/validators'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRequestId, logError, logInfo } from '@/lib/logger'
import { UserRole } from '@prisma/client'
import { generateOtp, hashOtp, isOtpExpired } from '@/lib/otp'
import { sendEmail } from '@/lib/email/smtp'
import { adminWelcomeTemplate, candidateWelcomeTemplate, signupOtpTemplate, welcomeTemplate } from '@/lib/email/templates'
import { sendOperationalAlert } from '@/lib/alerts'

const ALLOWED_ROLES = new Set<UserRole>([UserRole.CANDIDATE, UserRole.ADMIN])

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const limiter = checkRateLimit({ key: `auth-register:${ip}`, limit: 8, windowMs: 60_000 })
    if (!limiter.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
    }

    const body = await req.json()
    const email = asTrimmedString(body.email).toLowerCase()
    const password = asTrimmedString(body.password)
    const role = asTrimmedString(body.role).toUpperCase() as UserRole
    const otp = asTrimmedString(body.otp)
    const isVerifyStep = otp.length > 0

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid registration payload' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    if (!isVerifyStep) {
      if (password.length < 8 || !ALLOWED_ROLES.has(role)) {
        return NextResponse.json({ error: 'Invalid registration payload' }, { status: 400 })
      }
      const hashedPassword = await hash(password, 10)
      const generatedOtp = generateOtp()
      const otpHash = hashOtp(generatedOtp)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      await prisma.emailOtp.upsert({
        where: {
          email_purpose: { email, purpose: 'SIGNUP' },
        },
        update: {
          otpHash,
          passwordHash: hashedPassword,
          role,
          expiresAt,
          attempts: 0,
        },
        create: {
          email,
          purpose: 'SIGNUP',
          otpHash,
          passwordHash: hashedPassword,
          role,
          expiresAt,
          attempts: 0,
        },
      })

      const otpEmail = signupOtpTemplate(generatedOtp)
      const sent = await sendEmail({ to: email, subject: otpEmail.subject, html: otpEmail.html, text: otpEmail.text })
      if (!sent.sent) {
        void sendOperationalAlert('OTP delivery failure', `Route: /api/auth/register\nRequestId: ${requestId}\nEmail: ${email}\nReason: ${sent.reason || 'unknown'}`)
        return NextResponse.json({
          error: sent.reason ? `OTP email delivery failed: ${sent.reason}` : 'OTP email delivery failed.',
          requestId,
        }, { status: 500 })
      }
      return NextResponse.json({
        message: 'OTP sent to your email. Verify to complete account creation.',
        otpRequired: true,
        requestId,
      })
    }

    const pending = await prisma.emailOtp.findUnique({
      where: {
        email_purpose: { email, purpose: 'SIGNUP' },
      },
    })

    if (!pending || !pending.passwordHash || !pending.role) {
      return NextResponse.json({ error: 'No pending registration found. Request OTP first.' }, { status: 400 })
    }

    if (isOtpExpired(pending.expiresAt)) {
      await prisma.emailOtp.delete({ where: { email_purpose: { email, purpose: 'SIGNUP' } } }).catch(() => null)
      return NextResponse.json({ error: 'OTP expired. Please request a new OTP.' }, { status: 400 })
    }

    if (pending.attempts >= 5) {
      return NextResponse.json({ error: 'Too many invalid OTP attempts. Request a new OTP.' }, { status: 429 })
    }

    if (pending.otpHash !== hashOtp(otp)) {
      await prisma.emailOtp.update({
        where: { email_purpose: { email, purpose: 'SIGNUP' } },
        data: { attempts: { increment: 1 } },
      })
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: pending.passwordHash,
        role: pending.role,
        emailVerified: true,
      }
    })
    await prisma.emailOtp.delete({ where: { email_purpose: { email, purpose: 'SIGNUP' } } }).catch(() => null)

    // Create session
    await login({ id: user.id, email: user.email, role: user.role, isOnboarded: false })
    logInfo('User registration successful', { route: '/api/auth/register', requestId, userId: user.id })
    const welcome =
      user.role === 'ADMIN'
        ? adminWelcomeTemplate(user.email)
        : user.role === 'CANDIDATE'
          ? candidateWelcomeTemplate(user.email)
          : welcomeTemplate(user.email, user.role)
    await sendEmail({ to: user.email, subject: welcome.subject, html: welcome.html, text: welcome.text }).catch(() => null)

    return NextResponse.json({ message: 'User created', role: user.role, isOnboarded: false, requestId })
  } catch (err: any) {
    logError('Register route failed', { route: '/api/auth/register', requestId }, err)
    return NextResponse.json({ error: err.message, requestId }, { status: 500 })
  }
}
