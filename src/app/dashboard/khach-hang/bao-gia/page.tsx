import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import CreateOrderForm from './CreateOrderForm'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { safeCreateActionLog } from '@/lib/action-log'
import { getEstimatedDelivery } from '@/lib/sla'
import {
  formatCurrencyVnd,
  formatDateOnly,
  getCustomerOrders,
  orderStatusClass,
  orderStatusLabel,
} from '@/lib/customer-portal'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Send,
} from 'lucide-react'

const serviceOptions = [
  { value: 'ftl', label: 'Vận tải nguyên xe (FTL)' },
  { value: 'ltl', label: 'Vận tải ghép hàng (LTL)' },
  { value: 'cold', label: 'Vận tải lạnh' },
]

const quoteSchema = z.object({
  serviceType: z.string().min(1, 'Vui lòng chọn dịch vụ.'),
  origin: z.string().min(2, 'Vui lòng nhập điểm gửi.'),
  destination: z.string().min(2, 'Vui lòng nhập điểm nhận.'),
  weightKg: z.string().optional(),
  totalAmount: z.string().optional(),
  note: z.string().optional(),
})

const EXECUTION_MODES = new Set(['manual', 'automation'])

function makeOrderCode() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(100 + Math.random() * 900)
  return `VEX-${y}${m}${d}-${random}`
}

const ORDER_DISPATCH_WEBHOOK_URL =
  process.env.ORDER_DISPATCH_WEBHOOK_URL ||
  'https://brute-qualm-marina.ngrok-free.dev/webhook-test/order-dispatch'

async function notifyOrderDispatchWebhook(payload: {
  orderId: string
  orderCode: string
  customerId: string
  origin: string
  destination: string
  weight: number | null
  serviceType: string
  notes: string
}) {
  if (!ORDER_DISPATCH_WEBHOOK_URL) return

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(ORDER_DISPATCH_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Order dispatch webhook returned non-2xx status:', response.status)
    }
  } catch (error) {
    console.error('Order dispatch webhook error:', error)
  } finally {
    clearTimeout(timeout)
  }
}

function parsePositiveInteger(value: string | undefined) {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.round(parsed)
}

async function createOrderRequest(formData: FormData) {
  'use server'

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const fromProvince = String(formData.get('fromProvince') ?? '').trim()
  const fromDistrict = String(formData.get('fromDistrict') ?? '').trim()
  const fromWard = String(formData.get('fromWard') ?? '').trim()
  const toProvince = String(formData.get('toProvince') ?? '').trim()
  const toDistrict = String(formData.get('toDistrict') ?? '').trim()
  const toWard = String(formData.get('toWard') ?? '').trim()

  const originStr = [fromWard, fromDistrict, fromProvince].filter(Boolean).join(', ')
  const destinationStr = [toWard, toDistrict, toProvince].filter(Boolean).join(', ')

  const dimensions = String(formData.get('dimensions') ?? '').trim()
  const noteRaw = String(formData.get('note') ?? '').trim()
  const combinedNote = [
    dimensions ? `Kích thước: ${dimensions}` : '',
    noteRaw
  ].filter(Boolean).join(' | ')

  const rawInput = {
    serviceType: String(formData.get('serviceType') ?? '').trim(),
    origin: originStr,
    destination: destinationStr,
    weightKg: String(formData.get('weightKg') ?? '').trim(),
    totalAmount: String(formData.get('totalAmount') ?? '').trim(),
    note: combinedNote,
  }

  const executionModeRaw = String(formData.get('executionMode') ?? '').trim().toLowerCase()
  const executionMode = EXECUTION_MODES.has(executionModeRaw) ? executionModeRaw : 'manual'

  const parsed = quoteSchema.parse(rawInput)


  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      orderCode: makeOrderCode(),
      serviceType: parsed.serviceType,
      origin: parsed.origin,
      destination: parsed.destination,
      status: 'pending',
      currentLocation: parsed.origin,
      weightKg: parsePositiveInteger(parsed.weightKg),
      totalAmount: parsePositiveInteger(parsed.totalAmount),
      estimatedDelivery: getEstimatedDelivery(parsed.serviceType, parsed.origin, parsed.destination),
    },
  })

  await prisma.$transaction([
    prisma.trackingEvent.create({
      data: {
        orderId: order.id,
        status: 'pending',
        location: parsed.origin,
        description: parsed.note || 'Đơn hàng đã được tạo và đang chờ lấy hàng.',
      },
    }),
    prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'info',
        title: `Đã tạo đơn ${order.orderCode}`,
        message: `Hệ thống đã tiếp nhận đơn từ ${parsed.origin} đến ${parsed.destination}.`,
      },
    }),
  ])

  await safeCreateActionLog({
    actor: { connect: { id: session.user.id } },
    mode: executionMode,
    actionType: 'CUSTOMER_CREATE_ORDER',
    entityType: 'order',
    entityId: order.id,
    metadata: {
      orderCode: order.orderCode,
      serviceType: parsed.serviceType,
      origin: parsed.origin,
      destination: parsed.destination,
    },
  })

  // Trigger n8n Order Dispatch Webhook
  void notifyOrderDispatchWebhook({
    orderId: order.id,
    orderCode: order.orderCode,
    customerId: session.user.id,
    origin: order.origin,
    destination: order.destination,
    weight: order.weightKg,
    serviceType: order.serviceType,
    notes: parsed.note || '',
  })

  revalidatePath('/dashboard/khach-hang/bao-gia')
  revalidatePath('/dashboard/khach-hang/don-hang')
  revalidatePath('/dashboard/khach-hang/theo-doi')
  revalidatePath('/dashboard/khach-hang')
  redirect('/dashboard/khach-hang/bao-gia?created=1')
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams?: Promise<{ created?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const params = searchParams ? await searchParams : undefined
  const { orders } = await getCustomerOrders(session.user.id)

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-border/50 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Tạo đơn
            </p>
            <h1 className="text-2xl font-bold font-display">
              Tạo đơn gửi hàng ngay
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Thay vì gửi báo giá, bạn có thể tạo đơn trực tiếp. Hệ thống sẽ tạo mã
              vận đơn, ghi nhận tracking ban đầu và đưa vào quy trình lấy hàng.
            </p>
          </div>
          <Link
            href="/dashboard/khach-hang/don-hang"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            Xem đơn hàng
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {params?.created === '1' && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Đơn hàng đã được tạo thành công.
        </div>
      )}

      <section className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CreateOrderForm onSubmitAction={createOrderRequest} />

          <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold font-display">
                  Quy trình sau khi tạo đơn
                </h3>
                <p className="text-sm text-muted-foreground">
                  Đơn được đưa vào luồng lấy hàng và theo dõi tự động.
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>1. Tạo đơn và sinh mã vận đơn</div>
              <div>2. Hệ thống tiếp nhận và chờ lấy hàng</div>
              <div>3. Nhân viên cập nhật tracking theo từng mốc</div>
              <div>4. Hoàn tất giao hàng và đối soát</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold font-display">
              Đơn tạo gần đây
            </h2>
            <span className="text-sm text-muted-foreground">{orders.length} đơn</span>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có đơn nào</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Hãy tạo đơn đầu tiên để bắt đầu quy trình lấy hàng và giao hàng.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <article key={order.id} className="p-6 space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold font-display">
                          {order.orderCode}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${orderStatusClass(order.status)}`}>
                          {orderStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand" />
                        {order.origin} → {order.destination}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Dịch vụ: <span className="text-foreground font-medium">{order.serviceType}</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-4 text-sm min-w-52">
                      <div className="text-muted-foreground mb-1">Giá trị đơn</div>
                      <div className="text-xl font-bold font-display">
                        {formatCurrencyVnd(order.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Tạo ngày {formatDateOnly(order.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-xs text-muted-foreground mb-1">Trọng lượng</div>
                      <div className="font-medium">
                        {order.weightKg ? `${order.weightKg.toLocaleString('vi-VN')} kg` : 'Chưa khai báo'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-xs text-muted-foreground mb-1">Dự kiến giao</div>
                      <div className="font-medium">{formatDateOnly(order.estimatedDelivery)}</div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-xs text-muted-foreground mb-1">Cập nhật</div>
                      <div className="font-medium">{formatDateOnly(order.updatedAt)}</div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/khach-hang/theo-doi?order=${order.orderCode}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
                  >
                    <Clock className="w-4 h-4" />
                    Mở trang theo dõi
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
