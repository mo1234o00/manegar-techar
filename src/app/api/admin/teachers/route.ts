import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession, createUnauthorizedResponse } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return createUnauthorizedResponse()
    }

    const user = await verifySession(token)
    
    if (!user || user.role !== 'admin') {
      return createUnauthorizedResponse()
    }

    // Get all teachers with their statistics
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      include: {
        academicYears: {
          include: {
            groups: {
              include: {
                _count: {
                  select: { students: true }
                }
              }
            }
          }
        }
      }
    })

    const teachersWithStats = teachers.map(teacher => {
      const totalYears = teacher.academicYears.length
      const totalGroups = teacher.academicYears.reduce((sum, year) => sum + year.groups.length, 0)
      const totalStudents = teacher.academicYears.reduce((sum, year) => 
        sum + year.groups.reduce((groupSum, group) => groupSum + group._count.students, 0), 0
      )

      return {
        id: teacher.id,
        username: teacher.username,
        role: teacher.role,
        totalStudents,
        totalGroups,
        totalYears,
        createdAt: teacher.createdAt
      }
    })

    return NextResponse.json(teachersWithStats)
  } catch (error) {
    return NextResponse.json({ error: 'فشل تحميل البيانات' }, { status: 500 })
  }
}
