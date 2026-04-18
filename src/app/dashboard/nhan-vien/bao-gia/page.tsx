import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import { formatCurrencyVnd, formatDateTime, quoteStatusClass, quoteStatusLabel } from '@/lib/customer-portal'
import { ClipboardList } from 'lucide-react'
import { approveQuoteAction, rejectQuoteAction } from '../actions'

export default async function EmployeeQuotesPage() {
  await requireEmployeeSession()

  const quotes = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        include: { profile: true },
      },
    },
  })

  const pending = quotes.filter((quote) => quote.status === 'pending').length

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-border/50 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Bao gia</p>
        <h1 className="text-2xl font-bold font-display">Dieu phoi bao gia</h1>
        <p className="text-sm text-muted-foreground mt-2">Theo doi tat ca yeu cau bao gia va uu tien cac yeu cau dang cho xu ly.</p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
            <ClipboardList className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-display">{pending}</div>
          <div className="text-sm text-muted-foreground">Yeu cau cho xu ly</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center mb-3">
            <ClipboardList className="w-5 h-5 text-brand" />
          </div>
          <div className="text-2xl font-bold font-display">{quotes.length}</div>
          <div className="text-sm text-muted-foreground">Tong yeu cau bao gia</div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold font-display">Danh sach bao gia</h2>
        </div>

        {quotes.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">Chua co yeu cau bao gia nao.</div>
        ) : (
          <div className="divide-y divide-border">
            {quotes.map((quote) => (
              <article key={quote.id} className="p-6 space-y-2">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{quote.quoteCode}</span>
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${quoteStatusClass(quote.status)}`}>
                        {quoteStatusLabel(quote.status)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {quote.origin} - {quote.destination} • {quote.user.profile?.fullName || quote.user.name || 'Khach hang'}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{formatCurrencyVnd(quote.quotedPrice)}</div>
                    <div>{formatDateTime(quote.createdAt)}</div>
                  </div>
                </div>
                {quote.note && <div className="text-xs text-muted-foreground">Ghi chu: {quote.note}</div>}
                {quote.status === 'pending' && (
                  <div className="pt-2 border-t border-border/70 grid gap-3 lg:grid-cols-2">
                    <form action={approveQuoteAction} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <input
                        type="number"
                        name="quotedPrice"
                        min={1000}
                        step={1000}
                        required
                        placeholder="Nhap gia VND"
                        className="h-9 rounded-lg border border-border px-3 text-sm"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3 rounded-lg bg-brand text-white text-xs font-semibold hover:opacity-90"
                      >
                        Duyet va bao gia
                      </button>
                    </form>

                    <form action={rejectQuoteAction} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <input type="hidden" name="quoteId" value={quote.id} />
                      <input
                        type="text"
                        name="reason"
                        placeholder="Ly do tu choi"
                        className="h-9 rounded-lg border border-border px-3 text-sm"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-500"
                      >
                        Tu choi
                      </button>
                    </form>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
