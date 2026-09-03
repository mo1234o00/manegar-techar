import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession, createUnauthorizedResponse } from '@/lib/auth'

const DAY_NAMES_EN = {
  'الأحد': 'Sunday',
  'الاثنين': 'Monday',
  'الثلاثاء': 'Tuesday',
  'الأربعاء': 'Wednesday',
  'الخميس': 'Thursday',
  'الجمعة': 'Friday',
  'السبت': 'Saturday'
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

    const totalStudents = await prisma.student.count({
      where: {
        group: {
          year: {
            userId: user.id
          }
        }
      }
    })
    const totalGroups = await prisma.group.count({
      where: {
        year: {
          userId: user.id
        }
      }
    })
    const totalYears = await prisma.academicYear.count({
      where: {
        userId: user.id
      }
    })

    const today = new Date()
    // Use local time instead of UTC
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const todayName = dayNames[localToday.getDay()]

    // Get all groups for this user first
    const allGroups = await prisma.group.findMany({
      include: {
        year: true,
        _count: {
          select: { students: true }
        }
      },
      where: {
        year: {
          userId: user.id
        },
        createdAt: {
          lte: today
        }
      }
    })

    // Filter groups that have today's day (handle both Arabic and English)
    const todayGroups = allGroups.filter(group => {
      const groupDays = group.days.split(',')
      return groupDays.some(day => {
        const englishDay = DAY_NAMES_EN[day as keyof typeof DAY_NAMES_EN] || day
        return englishDay === todayName
      })
    })

    const years = await prisma.academicYear.findMany({
      where: {
        userId: user.id
      },
      include: {
        groups: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    return NextResponse.json({
      totalStudents,
      totalGroups,
      totalYears,
      todayGroups,
      years
    })
  } catch (error) {
    return NextResponse.json({ error: 'فشل تحميل البيانات' }, { status: 500 })
  }
}
