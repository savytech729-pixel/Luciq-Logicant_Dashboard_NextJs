import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-for-local-dev-only'
const key = new TextEncoder().encode(SECRET_KEY)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function decrypt(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, key, {
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
