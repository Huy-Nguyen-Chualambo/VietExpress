import { NextResponse } from 'next/server'
import { z } from 'zod'

const QUOTE_APPROVAL_WEBHOOK_URL =
  process.env.QUOTE_APPROVAL_WEBHOOK_URL ||
  'https://844f-42-116-206-217.ngrok-free.app/webhook-test/quote-approval'

const quoteApprovalSchema = z.object({
  quoteId: z.string().trim().min(1),
  quoteCode: z.string().trim().min(1),
  status: z.literal('quoted'),
  quotedPrice: z.number().int().positive(),
  approvedAt: z.string().trim().min(1),
  customer: z.object({
    fullName: z.string().trim().min(1),
    phone: z.string().trim().nullable().optional(),
    email: z.string().trim().email().nullable().optional(),
    company: z.string().trim().nullable().optional(),
  }),
  quote: z.object({
    serviceType: z.string().trim().min(1),
    origin: z.string().trim().min(1),
    destination: z.string().trim().min(1),
    weight: z.string().trim().nullable().optional(),
    dimensions: z.string().trim().nullable().optional(),
    note: z.string().trim().nullable().optional(),
  }),
  message: z.string().trim().min(1),
})

export type QuoteApprovalPayload = z.infer<typeof quoteApprovalSchema>

export async function notifyQuoteApprovalWebhook(payload: QuoteApprovalPayload) {
  if (!QUOTE_APPROVAL_WEBHOOK_URL) return

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(QUOTE_APPROVAL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Quote approval webhook returned non-2xx status:', response.status)
    }
  } catch (error) {
    console.error('Quote approval webhook error:', error)
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = quoteApprovalSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Dữ liệu duyệt báo giá không hợp lệ.',
          issues: result.error.flatten(),
        },
        { status: 400 }
      )
    }

    await notifyQuoteApprovalWebhook(result.data)

    return NextResponse.json(
      {
        ok: true,
        quoteId: result.data.quoteId,
        quoteCode: result.data.quoteCode,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Quote approval API error:', error)
    return NextResponse.json(
      { error: 'Không thể gửi duyệt báo giá. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}