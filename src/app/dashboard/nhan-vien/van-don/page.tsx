import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import {
  formatCurrencyVnd,
  formatDateOnly,
  formatDateTime,
  orderStatusClass,
  orderStatusLabel,
} from '@/lib/customer-portal'
import { Package, Route, Truck } from 'lucide-react'
import { updateOrderStatusAction } from '../actions'

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Cho xu ly' },
  { value: 'picked_up', label: 'Da lay hang' },
  { value: 'in_transit', label: 'Dang van chuyen' },
  { value: 'delivering', label: 'Dang giao' },
  { value: 'completed', label: 'Hoan thanh' },
  { value: 'cancelled', label: 'Da huy' },
]

export default async function EmployeeOrdersPage() {
  await requireEmployeeSession()

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        include: { profile: true },
      },
      trackingEvents: {
        orderBy: { eventTime: 'desc' },
        take: 1,
      },
    },
  })

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-border/50 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Van don</p>
        <h1 className="text-2xl font-bold font-display">Quan ly van don toan he thong</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Theo doi danh sach van don, trang thai xu ly va cap nhat tracking gan nhat.
        </p>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-brand" />
          </div>
          <div className="text-2xl font-bold font-display">{orders.length.toLocaleString('vi-VN')}</div>
          <div className="text-sm text-muted-foreground">Tong van don</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-display">
            {orders.filter((o) => ['pending', 'picked_up', 'in_transit', 'delivering'].includes(o.status)).length}
          </div>
          <div className="text-sm text-muted-foreground">Dang xu ly</div>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
            <Route className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold font-display">
            {orders.filter((o) => o.status === 'completed').length}
          </div>
          <div className="text-sm text-muted-foreground">Da hoan thanh</div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold font-display">Danh sach van don</h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">Chua co du lieu van don.</div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => {
              const latestEvent = order.trackingEvents[0]
              return (
                <article key={order.id} className="p-6 space-y-2">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{order.orderCode}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${orderStatusClass(order.status)}`}>
                          {orderStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {order.origin} - {order.destination} • {order.user.profile?.fullName || order.user.name || 'Khach hang'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatCurrencyVnd(order.totalAmount)}</div>
                      <div className="text-xs text-muted-foreground">ETA: {formatDateOnly(order.estimatedDelivery)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tracking: {latestEvent ? `${latestEvent.location} - ${formatDateTime(latestEvent.eventTime)}` : 'Chua co'}
                  </div>
                  <form action={updateOrderStatusAction} className="pt-2 border-t border-border/70 grid gap-2 lg:grid-cols-4">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="executionMode" value="manual" />
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="h-9 rounded-lg border border-border px-3 text-sm bg-white"
                    >
                      {ORDER_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="location"
                      defaultValue={order.currentLocation ?? ''}
                      placeholder="Vi tri hien tai"
                      className="h-9 rounded-lg border border-border px-3 text-sm"
                    />
                    <input
                      type="text"
                      name="description"
                      placeholder="Ghi chu tracking (tu chon)"
                      className="h-9 rounded-lg border border-border px-3 text-sm"
                    />
                    <button
                      type="submit"
                      className="h-9 px-3 rounded-lg bg-brand text-white text-xs font-semibold hover:opacity-90"
                    >
                      Cap nhat trang thai
                    </button>
                  </form>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
