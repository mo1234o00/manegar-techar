import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifySession, createUnauthorizedResponse } from '@/lib/auth'

const createAttendanceSchema = z.object({
  studentId: z.string(),
  groupId: z.string(),
  date: z.string(),
  status: z.enum(['Present', 'Absent', 'Excused', 'Late']),
})

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
    const { studentId, groupId, date, status } = createAttendanceSchema.parse(body)

    // Verify that the group belongs to the user
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { year: true }
    })

    if (!group || (group.year as any).userId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const attendanceDate = new Date(date)

    // Check if attendance already exists for this student on this date
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId,
          date: attendanceDate,
        },
      },
    })

    let attendance
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status },
      })
    } else {
      attendance = await prisma.attendance.create({
        data: {
          studentId,
          groupId,
          date: attendanceDate,
          status,
        },
      })
    }

    return NextResponse.json(attendance)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
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

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const date = searchParams.get('date')

    if (!groupId || !date) {
      return NextResponse.json({ error: 'Group ID and date are required' }, { status: 400 })
    }

    // Verify that the group belongs to the user
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { year: true }
    })

    if (!group || (group.year as any).userId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const attendanceDate = new Date(date)

    const attendance = await prisma.attendance.findMany({
      where: {
        groupId,
        date: attendanceDate,
      },
      include: {
        student: true,
      },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}
