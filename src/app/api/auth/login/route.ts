import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // Generate session token (3 hours = 10800000 ms)
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours from now

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    })

    return NextResponse.json({
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token: session.token
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'فشل تسجيل الدخول' }, { status: 500 })
  }
}
