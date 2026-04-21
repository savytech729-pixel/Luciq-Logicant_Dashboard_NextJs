import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { login } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
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

    // Create session
    await login({ 
      id: existingUser.id, 
      email: existingUser.email, 
      role: existingUser.role,
      isOnboarded: existingUser.isOnboarded 
    })

    return NextResponse.json({ 
      message: 'Logged in', 
      role: existingUser.role,
      isOnboarded: existingUser.isOnboarded
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
