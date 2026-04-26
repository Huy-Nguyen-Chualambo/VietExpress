import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import {
  formatCurrencyVnd,
  formatDateOnly,
  quoteStatusClass,
  quoteStatusLabel,
} from '@/lib/customer-portal'
import { ClipboardList, FileText, Mail, Phone } from 'lucide-react'
import { approveQuoteAction, rejectQuoteAction } from '../actions'

const QUOTE_STATUS_OPTIONS = ['pending', 'quoted', 'accepted', 'rejected'] as const

export default async function EmployeeQuotesPage() {
  await requireEmployeeSession()

  const quoteRequests = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        include: { profile: true },
      },
    },
  })

  const pending = quoteRequests.filter((quote) => quote.status === 'pending').length
  const quoted = quoteRequests.filter((quote) => quote.status === 'quoted').length
  const accepted = quoteRequests.filter((quote) => quote.status === 'accepted').length

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-border/50 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Báo giá</p>
        <h1 className="text-2xl font-bold font-display">Điều phối yêu cầu báo giá</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Theo dõi các yêu cầu báo giá mới, phản hồi giá và cập nhật trạng thái xử lý ngay từ dữ liệu thật trong hệ thống.
        </p>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
            <ClipboardList className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-display">{pending}</div>
          <div className="text-sm text-muted-foreground">Chờ báo giá</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-display">{quoted}</div>
          <div className="text-sm text-muted-foreground">Đã báo giá</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-brand" />
          </div>
          <div className="text-2xl font-bold font-display">{accepted}</div>
          <div className="text-sm text-muted-foreground">Đã chấp nhận</div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold font-display">Danh sách báo giá</h2>
        </div>

        {quoteRequests.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">Chưa có yêu cầu báo giá nào.</div>
        ) : (
          <div className="divide-y divide-border">
            {quoteRequests.map((quote) => (
              <article key={quote.id} className="p-6 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{quote.quoteCode}</span>
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${quoteStatusClass(quote.status)}`}>
                        {quoteStatusLabel(quote.status)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {quote.origin} - {quote.destination} • {quote.user.profile?.fullName || quote.user.name || 'Khách hàng'}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{formatCurrencyVnd(quote.quotedPrice)}</div>
                    <div>{formatDateOnly(quote.createdAt)}</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-border p-4">
                    <div className="text-xs text-muted-foreground mb-1">Dịch vụ</div>
                    <div className="font-medium">{quote.serviceType}</div>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <div className="text-xs text-muted-foreground mb-1">Trọng lượng</div>
                    <div className="font-medium">{quote.weight || 'Chưa khai báo'}</div>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <div className="text-xs text-muted-foreground mb-1">Kích thước</div>
                    <div className="font-medium">{quote.dimensions || 'Chưa khai báo'}</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border p-4 bg-muted/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      Email liên hệ
                    </div>
                    <div className="font-medium break-all">
                      {quote.user.profile?.email || quote.user.email || 'Chưa có email'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4 bg-muted/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Phone className="w-4 h-4" />
                      Số điện thoại
                    </div>
                    <div className="font-medium">
                      {quote.user.profile?.phone || 'Chưa có số điện thoại'}
                    </div>
                  </div>
                </div>

                {quote.note ? (
                  <div className="rounded-xl bg-muted/30 p-4 text-sm text-foreground/80">
                    {quote.note}
                  </div>
                ) : null}

                {quote.status === 'pending' ? (
                  <div className="pt-2 border-t border-border/70 grid gap-3 lg:grid-cols-2">
                    <form action={approveQuoteAction} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <input
                        type="number"
                        name="quotedPrice"
                        min={1000}
                        step={1000}
                        required
                        placeholder="Nhập giá VND"
                        className="h-9 rounded-lg border border-border px-3 text-sm"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3 rounded-lg bg-brand text-white text-xs font-semibold hover:opacity-90"
                      >
                        Duyệt và báo giá
                      </button>
                    </form>

                    <form action={rejectQuoteAction} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <input
                        type="text"
                        name="reason"
                        placeholder="Lý do từ chối"
                        className="h-9 rounded-lg border border-border px-3 text-sm"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-500"
                      >
                        Từ chối
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
