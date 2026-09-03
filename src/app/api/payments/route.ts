import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPaymentSchema = z.object({
  studentId: z.string(),
  groupId: z.string(),
  month: z.string(),
  amountRequired: z.number(),
  amountPaid: z.number(),
  discount: z.number(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, groupId, month, amountRequired, amountPaid, discount } = createPaymentSchema.parse(body)

    const netPaid = amountPaid + discount
    let status: 'Full' | 'Partial' | 'Unpaid'

    if (netPaid >= amountRequired) {
      status = 'Full'
    } else if (netPaid > 0) {
      status = 'Partial'
    } else {
      status = 'Unpaid'
    }

    // Check if payment already exists for this student for this month
    const existing = await prisma.payment.findUnique({
      where: {
        studentId_month: {
          studentId,
          month,
        },
      },
    })

    let payment
    if (existing) {
      payment = await prisma.payment.update({
        where: { id: existing.id },
        data: {
          amountPaid,
          discount,
          status,
        },
      })
    } else {
      payment = await prisma.payment.create({
        data: {
          studentId,
          groupId,
          month,
          amountRequired,
          amountPaid,
          discount,
          status,
        },
      })
    }

    return NextResponse.json(payment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to save payment' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')
  const month = searchParams.get('month')

  if (!groupId || !month) {
    return NextResponse.json({ error: 'Group ID and month are required' }, { status: 400 })
  }

  const payments = await prisma.payment.findMany({
    where: {
      groupId,
      month,
    },
    include: {
      student: true,
    },
  })

  return NextResponse.json(payments)
}
