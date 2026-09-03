import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function verifySession(token: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session) {
      return null
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } })
      return null
    }

    return session.user
  } catch (error) {
    return null
  }
}

export function createUnauthorizedResponse() {
  return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
}
