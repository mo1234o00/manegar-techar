import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const groupSchema = z.object({
  days: z.array(z.string()).min(1, 'لازم تختار يوم على الأقل'),
  time: z.string().min(1, 'مطلوب الوقت'),
  monthlyPrice: z.number().min(0, 'السعر لازم يكون رقم موجب'),
})

const DAY_NAMES_MAP: Record<string, string> = {
  'السبت': 'Saturday',
  'الأحد': 'Sunday',
  'الاثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الخميس': 'Thursday',
  'الجمعة': 'Friday'
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const validatedData = groupSchema.parse(body)

    // Convert Arabic days to English
    const englishDays = validatedData.days.map(day => {
      if (DAY_NAMES_MAP[day]) {
        return DAY_NAMES_MAP[day]
      }
      return day
    })

    // Generate auto name
    const dayNamesAr = englishDays.map(day => {
      const reverseMap: Record<string, string> = {
        'Saturday': 'السبت',
        'Sunday': 'الأحد',
        'Monday': 'الاثنين',
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة'
      }
      return reverseMap[day] || day
    })
    const autoName = `${dayNamesAr.join('، ')} - ${validatedData.time}`

    const group = await prisma.group.update({
      where: { id },
      data: {
        days: englishDays.join(','),
        time: validatedData.time,
        monthlyPrice: validatedData.monthlyPrice,
        autoName,
      },
    })

    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'فشل تحديث المجموعة' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check if group has students
    const studentCount = await prisma.student.count({
      where: { groupId: id },
    })

    if (studentCount > 0) {
      return NextResponse.json(
        { error: 'لازم تحذف الطلاب الأول قبل حذف المجموعة' },
        { status: 400 }
      )
    }

    await prisma.group.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'فشل حذف المجموعة' }, { status: 500 })
  }
}
