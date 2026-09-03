import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifySession, createUnauthorizedResponse } from '@/lib/auth'

const createAcademicYearSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
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
    const { startDate, endDate } = createAcademicYearSchema.parse(body)

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Auto-generate name from years
    const startYear = start.getFullYear()
    const endYear = end.getFullYear()
    const autoName = `${startYear}-${endYear}`

    const academicYear = await prisma.academicYear.create({
      data: {
        startDate: start,
        endDate: end,
        autoName,
        userId: user.id
      },
    })

    return NextResponse.json(academicYear)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create academic year' }, { status: 500 })
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

    const years = await prisma.academicYear.findMany({
      where: { userId: user.id },
      orderBy: {
        startDate: 'desc',
      },
    })
    return NextResponse.json(years)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch academic years' }, { status: 500 })
  }
}
