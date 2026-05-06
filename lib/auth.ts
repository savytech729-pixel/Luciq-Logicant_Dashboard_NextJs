import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { useBuildTimeEnvPlaceholders } from '@/lib/env-phase'

/** Avoid importing `lib/env` here — that loads DATABASE_URL/GEMINI at module init and breaks every page via `proxy.ts` if anything is missing on Vercel. */
function jwtSigningKey(): Uint8Array {
  const raw = process.env.JWT_SECRET?.trim()
  if (raw) return new TextEncoder().encode(raw)
  if (useBuildTimeEnvPlaceholders()) {
    return new TextEncoder().encode('__NEXT_BUILD_PLACEHOLDER_JWT_SECRET__')
  }
  // Runtime without secret: verification fails → decrypt returns null; login must set JWT_SECRET
  return new TextEncoder().encode('')
}

export async function encrypt(payload: any) {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret?.length) {
    if (useBuildTimeEnvPlaceholders()) {
      return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(jwtSigningKey())
    }
    throw new Error('JWT_SECRET is not configured')
  }
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(secret))
}

export async function decrypt(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, jwtSigningKey(), {
      algorithms: ['HS256'],
    })
    return payload
  } catch (err) {
    return null
  }
}

export async function getSession() {
  const c = await cookies()
  const val = c.get('session')?.value
  if (!val) return null
  return await decrypt(val)
}

export async function login(payload: any) {
  // Create the session
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const session = await encrypt(payload)

  // Save the session in a cookie
  const c = await cookies()
  c.set('session', session, { expires, httpOnly: true, path: '/' })
}

export async function logout() {
  const c = await cookies()
  c.delete('session')
}
