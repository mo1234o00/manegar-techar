import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    // Delete session
    await prisma.session.deleteMany({
      where: { token }
    })

    return NextResponse.json({ message: 'تم تسجيل الخروج بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'فشل تسجيل الخروج' }, { status: 500 })
  }
}
