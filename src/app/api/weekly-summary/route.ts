import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { verifySession, createUnauthorizedResponse } from '@/lib/auth'

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

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const weekStart = searchParams.get('weekStart') // Format: YYYY-MM-DD
    const weekEnd = searchParams.get('weekEnd') // Format: YYYY-MM-DD

    if (!groupId || !weekStart || !weekEnd) {
      return NextResponse.json({ error: 'Group ID, week start, and week end are required' }, { status: 400 })
    }

    // Verify that the group belongs to the user
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { year: true }
    })

    if (!group || (group.year as any).userId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const startDate = new Date(weekStart)
    const endDate = new Date(weekEnd)
    endDate.setHours(23, 59, 59, 999) // Include the entire end day

    // Get all students in the group
    const students = await prisma.student.findMany({
      where: { groupId },
      orderBy: { name: 'asc' }
    })

    // Calculate weekly summary for each student
    const summaries = await Promise.all(
      students.map(async (student) => {
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            studentId: student.id,
            groupId,
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        })

        const presentCount = attendanceRecords.filter(r => r.status === 'Present').length
        const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length
        const excusedCount = attendanceRecords.filter(r => r.status === 'Excused').length
        const lateCount = attendanceRecords.filter(r => r.status === 'Late').length

        // Calculate exam scores (only records with examScore > 0)
        const examScores = attendanceRecords
          .filter((r: any) => r.examScore !== null && r.examScore !== undefined && r.examScore > 0)
          .map((r: any) => r.examScore)
        
        const averageExamScore = examScores.length > 0
          ? examScores.reduce((sum, score) => sum + score, 0) / examScores.length
          : 0

        return {
          studentId: student.id,
          studentName: student.name,
          studentCode: student.studentCode,
          whatsappNumber: (student as any).whatsappNumber,
          countryCode: (student as any).countryCode,
          presentCount,
          absentCount,
          excusedCount,
          lateCount,
          totalSessions: attendanceRecords.length,
          averageExamScore: Math.round(averageExamScore * 10) / 10, // Round to 1 decimal
          examCount: examScores.length
        }
      })
    )

    return NextResponse.json(summaries)
  } catch (error) {
    console.error('Error fetching weekly summary:', error)
    return NextResponse.json({ error: 'Failed to fetch weekly summary' }, { status: 500 })
  }
}
