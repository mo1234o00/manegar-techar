import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifySession, createUnauthorizedResponse } from '@/lib/auth'

const createGroupSchema = z.object({
  yearId: z.string(),
  days: z.array(z.string()),
  time: z.string(),
  monthlyPrice: z.number(),
})

const DAY_NAMES_EN = {
  'الأحد': 'Sunday',
  'الاثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الخميس': 'Thursday',
  'الجمعة': 'Friday',
  'السبت': 'Saturday'
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return createUnauthorizedResponse()
    }

    const user = await verifySession(token)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { yearId, days, time, monthlyPrice } = createGroupSchema.parse(body)

    // Verify that the year belongs to the user
    const year = await prisma.academicYear.findUnique({
      where: { id: yearId }
    })

    if (!year || year.userId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // Convert Arabic days to English for storage
    const englishDays = days.map(day => DAY_NAMES_EN[day as keyof typeof DAY_NAMES_EN] || day)

    // Format time for display (e.g., "16:00" -> "4:00 PM")
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    const displayTime = `${displayHour}:${minutes} ${ampm}`

    // Auto-generate name from days and time (keep Arabic for display)
    const daysString = days.join(', ')
    const autoName = `${daysString} - ${displayTime}`

    const group = await prisma.group.create({
      data: {
        yearId,
        days: englishDays.join(','), // Store English days
        time,
        monthlyPrice,
        autoName,
      },
    })

    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return createUnauthorizedResponse()
    }

    const user = await verifySession(token)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const groups = await prisma.group.findMany({
      where: {
        year: {
          userId: user.id
        }
      },
      include: {
        year: true,
        _count: {
          select: { students: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(groups)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}
