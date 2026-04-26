import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { safeCreateActionLog } from '@/lib/action-log'
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
  { value: '3pl', label: 'Dịch vụ 3PL' },
  { value: 'express', label: 'Chuyển phát nhanh' },
  { value: 'cold', label: 'Vận tải lạnh' },
  { value: 'doc', label: 'Chứng từ & Thủ tục' },
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

  const rawInput = {
    serviceType: String(formData.get('serviceType') ?? '').trim(),
    origin: String(formData.get('origin') ?? '').trim(),
    destination: String(formData.get('destination') ?? '').trim(),
    weightKg: String(formData.get('weightKg') ?? '').trim(),
    totalAmount: String(formData.get('totalAmount') ?? '').trim(),
    note: String(formData.get('note') ?? '').trim(),
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
      estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 48),
    },
  })

  await prisma.$transaction([
    prisma.trackingEvent.create({
      data: {
        orderId: order.id,
        status: 'pending',
        location: parsed.origin,
        description: parsed.note || 'Don hang da duoc tao va dang cho lay hang.',
      },
    }),
    prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'info',
        title: `Da tao don ${order.orderCode}`,
        message: `He thong da tiep nhan don tu ${parsed.origin} den ${parsed.destination}.`,
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
              Tao don
            </p>
            <h1 className="text-2xl font-bold font-display">
              Tao don gui hang ngay
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Thay vi gui bao gia, ban co the tao don truc tiep. He thong se tao ma
              van don, ghi nhan tracking ban dau va dua vao quy trinh lay hang.
            </p>
          </div>
          <Link
            href="/dashboard/khach-hang/don-hang"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            Xem don hang
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {params?.created === '1' && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Don hang da duoc tao thanh cong.
        </div>
      )}

      <section className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center">
                <Send className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-base font-semibold font-display">
                  Tao don moi
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tao don truc tiep tu du lieu that.
                </p>
              </div>
            </div>

            <form action={createOrderRequest} className="space-y-4">
              <input type="hidden" name="executionMode" value="manual" />
              <div>
                <label className="block text-sm font-medium mb-2">Dich vu</label>
                <select
                  name="serviceType"
                  required
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <option value="">Chon dich vu</option>
                  {serviceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Diem gui</label>
                  <input
                    name="origin"
                    required
                    placeholder="TP. Ho Chi Minh"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Diem nhan</label>
                  <input
                    name="destination"
                    required
                    placeholder="Ha Noi"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Trong luong (kg)</label>
                  <input
                    name="weightKg"
                    inputMode="numeric"
                    placeholder="VD: 500"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gia tri don (VND)</label>
                  <input
                    name="totalAmount"
                    inputMode="numeric"
                    placeholder="VD: 2500000"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ghi chu</label>
                <textarea
                  name="note"
                  rows={4}
                  placeholder="Mo ta them ve yeu cau lay hang, giao hang"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:opacity-95 transition-opacity"
              >
                <Send className="w-4 h-4" />
                Tao don ngay
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold font-display">
                  Quy trinh sau khi tao don
                </h3>
                <p className="text-sm text-muted-foreground">
                  Don duoc dua vao luong lay hang va theo doi tu dong.
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>1. Tao don va sinh ma van don</div>
              <div>2. He thong tiep nhan va cho lay hang</div>
              <div>3. Nhan vien cap nhat tracking theo tung moc</div>
              <div>4. Hoan tat giao hang va doi soat</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold font-display">
              Don tao gan day
            </h2>
            <span className="text-sm text-muted-foreground">{orders.length} don</span>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chua co don nao</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Hay tao don dau tien de bat dau quy trinh lay hang va giao hang.
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
                        Dich vu: <span className="text-foreground font-medium">{order.serviceType}</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-4 text-sm min-w-52">
                      <div className="text-muted-foreground mb-1">Gia tri don</div>
                      <div className="text-xl font-bold font-display">
                        {formatCurrencyVnd(order.totalAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Tao ngay {formatDateOnly(order.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-xs text-muted-foreground mb-1">Trong luong</div>
                      <div className="font-medium">
                        {order.weightKg ? `${order.weightKg.toLocaleString('vi-VN')} kg` : 'Chua khai bao'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-xs text-muted-foreground mb-1">Du kien giao</div>
                      <div className="font-medium">{formatDateOnly(order.estimatedDelivery)}</div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-xs text-muted-foreground mb-1">Cap nhat</div>
                      <div className="font-medium">{formatDateOnly(order.updatedAt)}</div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/khach-hang/theo-doi?order=${order.orderCode}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
                  >
                    <Clock className="w-4 h-4" />
                    Mo trang theo doi
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
