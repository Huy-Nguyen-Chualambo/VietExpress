import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const quoteRequestSchema = z.object({
  name: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(5).max(50),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  company: z.string().trim().max(255).optional().or(z.literal('')),
  service: z.string().trim().min(1).max(50),
  from: z.string().trim().min(2).max(255),
  to: z.string().trim().min(2).max(255),
  weight: z.string().trim().max(50).optional().or(z.literal('')),
  dimensions: z.string().trim().max(100).optional().or(z.literal('')),
  note: z.string().trim().max(5000).optional().or(z.literal('')),
})

function makeQuoteCode() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(100 + Math.random() * 900)
  return `VEX-Q${y}${m}${d}-${random}`
}

function makeGuestEmail(quoteCode: string) {
  return `${quoteCode.toLowerCase()}@guest.vietexpress.local`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = quoteRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Dữ liệu báo giá không hợp lệ.',
          issues: result.error.flatten(),
        },
        { status: 400 }
      )
    }

    const input = result.data
    const email = input.email?.trim().toLowerCase() || null
    const company = input.company?.trim() || null
    const quoteCode = makeQuoteCode()
    const profileEmail = email ?? makeGuestEmail(quoteCode)

    const quote = await prisma.$transaction(async (transaction) => {
      let user = email
        ? await transaction.user.findUnique({
            where: { email },
          })
        : null

      if (!user) {
        user = await transaction.user.create({
          data: {
            email,
            name: input.name,
          },
        })
      } else if (user.name !== input.name) {
        user = await transaction.user.update({
          where: { id: user.id },
          data: {
            name: input.name,
          },
        })
      }

      const profile = await transaction.profile.findUnique({
        where: { id: user.id },
      })

      if (profile) {
        await transaction.profile.update({
          where: { id: user.id },
          data: {
            fullName: input.name,
            phone: input.phone,
            company,
            email: profileEmail,
          },
        })
      } else {
        await transaction.profile.create({
          data: {
            id: user.id,
            fullName: input.name,
            phone: input.phone,
            company,
            email: profileEmail,
            role: 'customer',
          },
        })
      }

      return transaction.quoteRequest.create({
        data: {
          userId: user.id,
          quoteCode,
          serviceType: input.service,
          origin: input.from,
          destination: input.to,
          weight: input.weight?.trim() || null,
          dimensions: input.dimensions?.trim() || null,
          note: input.note?.trim() || null,
        },
      })
    })

    revalidatePath('/dashboard/nhan-vien')
    revalidatePath('/dashboard/nhan-vien/bao-gia')
    revalidatePath('/dashboard/khach-hang')
    revalidatePath('/dashboard/khach-hang/bao-gia')

    return NextResponse.json(
      {
        quote: {
          id: quote.id,
          quoteCode: quote.quoteCode,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Quote request API error:', error)
    return NextResponse.json(
      { error: 'Không thể lưu yêu cầu báo giá. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}