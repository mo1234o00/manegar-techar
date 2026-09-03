import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const academicYearSchema = z.object({
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const validatedData = academicYearSchema.parse(body)

    // Generate auto name from dates
    const startYear = new Date(validatedData.startDate).getFullYear()
    const endYear = new Date(validatedData.endDate).getFullYear()
    const autoName = `${startYear}-${endYear}`

    const year = await prisma.academicYear.update({
      where: { id },
      data: {
        ...validatedData,
        autoName,
      },
    })

    return NextResponse.json(year)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'فشل تحديث السنة الأكاديمية' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check if year has groups
    const groupCount = await prisma.group.count({
      where: { yearId: id },
    })

    if (groupCount > 0) {
      return NextResponse.json(
        { error: 'لازم تحذف المجموعات الأول قبل حذف السنة' },
        { status: 400 }
      )
    }

    await prisma.academicYear.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'فشل حذف السنة الأكاديمية' }, { status: 500 })
  }
}
