import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession, createUnauthorizedResponse } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return createUnauthorizedResponse()
    }

    const user = await verifySession(token)
    
    if (!user || user.role !== 'admin') {
      return createUnauthorizedResponse()
    }

    // Delete teacher and all related data
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'تم حذف المدرس بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'فشل حذف المدرس' }, { status: 500 })
  }
}
