import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  formatCurrencyVnd,
  formatDateOnly,
  getCustomerQuotes,
  quoteStatusClass,
  quoteStatusLabel,
} from '@/lib/customer-portal'
import {
  ArrowRight,
  CheckCircle2,
  FileText,
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
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  note: z.string().optional(),
})

function makeCode(prefix: string) {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(100 + Math.random() * 900)
  return `${prefix}-${timestamp}-${random}`
}

async function createQuoteRequest(formData: FormData) {
  'use server'

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const rawInput = {
    serviceType: String(formData.get('serviceType') ?? '').trim(),
    origin: String(formData.get('origin') ?? '').trim(),
    destination: String(formData.get('destination') ?? '').trim(),
    weight: String(formData.get('weight') ?? '').trim(),
    dimensions: String(formData.get('dimensions') ?? '').trim(),
    note: String(formData.get('note') ?? '').trim(),
  }

  const parsed = quoteSchema.parse(rawInput)

  await prisma.quoteRequest.create({
    data: {
      userId: session.user.id,
      quoteCode: makeCode('BG'),
      serviceType: parsed.serviceType,
      origin: parsed.origin,
      destination: parsed.destination,
      weight: parsed.weight || null,
      dimensions: parsed.dimensions || null,
      note: parsed.note || null,
      status: 'pending',
    },
  })

  revalidatePath('/dashboard/khach-hang/bao-gia')
  redirect('/dashboard/khach-hang/bao-gia?sent=1')
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams?: Promise<{ sent?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const params = searchParams ? await searchParams : undefined
  const { quoteRequests } = await getCustomerQuotes(session.user.id)

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-border/50 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Báo giá
            </p>
            <h1 className="text-2xl font-bold font-(family-name:--font-display)">
              Yêu cầu báo giá mới
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Gửi thông tin lô hàng để nhận báo giá thật từ hệ thống. Tất cả yêu cầu
              sẽ được lưu trong cơ sở dữ liệu và hiển thị ở bảng phía dưới.
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

      {params?.sent === '1' && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Yêu cầu báo giá đã được tạo thành công.
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
                <h2 className="text-base font-semibold font-(family-name:--font-display)">
                  Gửi yêu cầu báo giá
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tạo yêu cầu mới từ dữ liệu thật.
                </p>
              </div>
            </div>

            <form action={createQuoteRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dịch vụ</label>
                <select
                  name="serviceType"
                  required
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <option value="">Chọn dịch vụ</option>
                  {serviceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Điểm gửi</label>
                  <input
                    name="origin"
                    required
                    placeholder="TP. Hồ Chí Minh"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Điểm nhận</label>
                  <input
                    name="destination"
                    required
                    placeholder="Hà Nội"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Trọng lượng</label>
                  <input
                    name="weight"
                    placeholder="VD: 500kg"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Kích thước</label>
                  <input
                    name="dimensions"
                    placeholder="VD: 120x80x100 cm"
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ghi chú</label>
                <textarea
                  name="note"
                  rows={4}
                  placeholder="Mô tả thêm về hàng hóa hoặc yêu cầu đặc biệt"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:opacity-95 transition-opacity"
              >
                <Send className="w-4 h-4" />
                Gửi yêu cầu
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold font-(family-name:--font-display)">
                  Quy trình xử lý
                </h3>
                <p className="text-sm text-muted-foreground">
                  Báo giá được tạo và theo dõi ngay trong hệ thống.
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>1. Tạo yêu cầu báo giá</div>
              <div>2. Điều phối viên kiểm tra thông tin</div>
              <div>3. Gửi báo giá và cập nhật trạng thái</div>
              <div>4. Chấp nhận báo giá để tạo đơn vận chuyển</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold font-(family-name:--font-display)">
              Lịch sử báo giá
            </h2>
            <span className="text-sm text-muted-foreground">{quoteRequests.length} yêu cầu</span>
          </div>

          {quoteRequests.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có báo giá nào</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Khi bạn gửi yêu cầu thật, lịch sử báo giá sẽ hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {quoteRequests.map((quote) => (
                <article key={quote.id} className="p-6 space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold font-(family-name:--font-display)">
                          {quote.quoteCode}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${quoteStatusClass(quote.status)}`}>
                          {quoteStatusLabel(quote.status)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand" />
                        {quote.origin} → {quote.destination}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Dịch vụ: <span className="text-foreground font-medium">{quote.serviceType}</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-4 text-sm min-w-52">
                      <div className="text-muted-foreground mb-1">Báo giá đề xuất</div>
                      <div className="text-xl font-bold font-(family-name:--font-display)">
                        {formatCurrencyVnd(quote.quotedPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Tạo ngày {formatDateOnly(quote.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-xs text-muted-foreground mb-1">Trọng lượng</div>
                      <div className="font-medium">{quote.weight || 'Chưa khai báo'}</div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-xs text-muted-foreground mb-1">Kích thước</div>
                      <div className="font-medium">{quote.dimensions || 'Chưa khai báo'}</div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <div className="text-xs text-muted-foreground mb-1">Cập nhật</div>
                      <div className="font-medium">{formatDateOnly(quote.updatedAt)}</div>
                    </div>
                  </div>

                  {quote.note && (
                    <div className="rounded-xl bg-brand-soft p-4 text-sm text-foreground/80">
                      {quote.note}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
