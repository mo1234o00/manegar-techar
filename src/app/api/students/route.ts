import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifySession, createUnauthorizedResponse } from '@/lib/auth'

const createStudentSchema = z.object({
  groupId: z.string(),
  name: z.string(),
  parentPhone: z.string(),
  whatsappNumber: z.string().optional().nullable(),
  countryCode: z.string().default('+966'),
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
    console.log('Received body:', body)
    
    const { groupId, name, parentPhone, whatsappNumber, countryCode } = createStudentSchema.parse(body)
    console.log('Parsed data:', { groupId, name, parentPhone, whatsappNumber, countryCode })

    // Verify that the group belongs to the user
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { year: true }
    })

    if (!group || (group.year as any).userId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    // Auto-generate student code (incremental)
    const lastStudent = await prisma.student.findFirst({
      orderBy: {
        studentCode: 'desc',
      },
    })

    const lastCode = lastStudent?.studentCode ? parseInt(lastStudent.studentCode) : 1000
    const newCode = (lastCode + 1).toString()
    console.log('Generated code:', newCode)

    const student = await prisma.student.create({
      data: {
        groupId,
        name,
        parentPhone,
        studentCode: newCode,
        whatsappNumber,
        countryCode,
      },
    })

    console.log('Created student:', student)
    return NextResponse.json(student)
  } catch (error) {
    console.error('Error creating student:', error)
    if (error instanceof z.ZodError) {
      console.error('Zod error:', error.issues)
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create student', details: String(error) }, { status: 500 })
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

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Verify that the group belongs to the user
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { year: true }
    })

    if (!group || (group.year as any).userId !== user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const students = await prisma.student.findMany({
      where: { groupId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(students)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}
