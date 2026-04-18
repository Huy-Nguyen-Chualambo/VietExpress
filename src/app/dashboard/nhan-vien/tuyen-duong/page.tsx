import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import { formatCurrencyVnd } from '@/lib/customer-portal'
import { MapPin, Route } from 'lucide-react'

export default async function EmployeeRoutesPage() {
  await requireEmployeeSession()

  const routes = await prisma.order.groupBy({
    by: ['origin', 'destination'],
    _count: { _all: true },
    _sum: { totalAmount: true },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 20,
  })

  const topFive = routes.slice(0, 5)

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-border/50 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Tuyen duong</p>
        <h1 className="text-2xl font-bold font-display">Hieu suat theo tuyen</h1>
        <p className="text-sm text-muted-foreground mt-2">Tong hop theo cap diem gui - diem nhan tu du lieu van don thuc te.</p>
      </section>

      <section className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border/50 p-6 space-y-4">
          <h2 className="text-base font-semibold font-display">Top 5 tuyen</h2>
          {topFive.length === 0 ? (
            <div className="text-sm text-muted-foreground">Chua co du lieu.</div>
          ) : (
            topFive.map((route) => (
              <div key={`${route.origin}-${route.destination}`} className="rounded-xl bg-muted/30 p-4">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand" />
                  {route.origin} - {route.destination}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {route._count._all} chuyen • {formatCurrencyVnd(route._sum.totalAmount ?? 0)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold font-display">Tat ca tuyen</h2>
            <Route className="w-4 h-4 text-muted-foreground" />
          </div>

          {routes.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">Chua co du lieu tuyen duong.</div>
          ) : (
            <div className="divide-y divide-border">
              {routes.map((route) => (
                <div key={`${route.origin}-${route.destination}`} className="p-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{route.origin} - {route.destination}</div>
                    <div className="text-xs text-muted-foreground mt-1">{route._count._all} chuyen</div>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrencyVnd(route._sum.totalAmount ?? 0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
