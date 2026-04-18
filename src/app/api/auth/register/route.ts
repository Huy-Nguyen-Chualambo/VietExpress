import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

const registerSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(100),
  phone: z.string().min(5).max(50).optional().or(z.literal('')),
  company: z.string().max(255).optional().or(z.literal('')),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Dữ liệu đăng ký không hợp lệ.',
          issues: result.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { fullName, email, password, phone, company } = result.data

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email này đã được sử dụng.' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          email,
          name: fullName,
          passwordHash,
        },
      })

      await transaction.profile.create({
        data: {
          id: createdUser.id,
          fullName,
          phone: phone || null,
          company: company || null,
          email,
          role: 'customer',
        },
      })

      return createdUser
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'Không thể tạo tài khoản. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}