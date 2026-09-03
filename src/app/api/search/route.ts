import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  const students = await prisma.student.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { studentCode: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      group: {
        include: {
          year: true,
        },
      },
    },
    take: 10,
  })

  return NextResponse.json(students)
}
