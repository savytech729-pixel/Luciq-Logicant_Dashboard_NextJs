import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

const protectedRoutes = ['/candidate', '/admin']

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedRoutes.some(r => path.startsWith(r))

  if (isProtected) {
    const session = req.cookies.get('session')?.value
    const decrypted = session ? await decrypt(session) : null

    if (!decrypted) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Role-based protection check
    if (path.startsWith('/admin') && decrypted.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    if (path.startsWith('/candidate') && decrypted.role !== 'CANDIDATE') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Redirect from public routes if already logged in
  if (path === '/login' || path === '/register') {
    const session = req.cookies.get('session')?.value
    const decrypted = session ? await decrypt(session) : null
    
    if (decrypted) {
      if (decrypted.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/candidate/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
