import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { login } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json()
    
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role // "CANDIDATE" or "ADMIN"
      }
    })

    // Create session
    await login({ id: user.id, email: user.email, role: user.role, isOnboarded: false })

    return NextResponse.json({ message: 'User created', role: user.role, isOnboarded: false })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
