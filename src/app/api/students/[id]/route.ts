import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const studentSchema = z.object({
  name: z.string().min(2, 'الاسم لازم يكون حرفين على الأقل'),
  parentPhone: z.string().min(5, 'رقم التليفون مطلوب'),
  whatsappNumber: z.string().optional().nullable(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const validatedData = studentSchema.parse(body)

    const student = await prisma.student.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(student)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'فشل تحديث الطالب' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.student.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'فشل حذف الطالب' }, { status: 500 })
  }
}
