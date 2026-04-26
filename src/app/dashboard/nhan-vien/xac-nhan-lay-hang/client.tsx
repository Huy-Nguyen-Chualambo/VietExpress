'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { confirmPickupAction } from '../actions'

interface User {
  profile?: {
    fullName: string | null
    company: string | null
    phone: string | null
  } | null
}

interface PendingOrder {
  id: string
  orderCode: string
  origin: string
  destination: string
  serviceType: string
  weightKg: number | null
  totalAmount: number | null
  createdAt: Date
  user?: User
}

interface PickupConfirmationClientProps {
  orders: PendingOrder[]
  pendingCount: number
}

export default function PickupConfirmationClient({ orders = [], pendingCount = 0 }: PickupConfirmationClientProps) {
  const router = useRouter()
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [confirmingOrders, setConfirmingOrders] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    location: '',
    notes: '',
    pickupTime: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = async (orderId: string) => {
    if (!formData.location.trim()) {
      alert('Vui lòng nhập địa điểm lấy hàng')
      return
    }

    setConfirmingOrders((prev) => new Set(prev).add(orderId))

    try {
      const fd = new FormData()
      fd.set('orderId', orderId)
      fd.set('location', formData.location)
      fd.set('pickupTime', formData.pickupTime)
      fd.set('notes', formData.notes)
      fd.set('executionMode', 'manual')

      await confirmPickupAction(fd)

      setFormData({ location: '', notes: '', pickupTime: new Date().toISOString().split('T')[0] })
      setSelectedOrder(null)

      router.refresh()
    } catch (error) {
      alert('Lỗi xác nhận lấy hàng')
      console.error(error)
    } finally {
      setConfirmingOrders((prev) => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const serviceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ftl: 'Vận tải nguyên xe (FTL)',
      ltl: 'Vận tải ghép hàng (LTL)',
      '3pl': 'Kho - Vận - Phân phối',
      express: 'Nhanh 24h',
      cold: 'Vận tải lạnh',
      doc: 'Chứng từ và thủ tục',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Xác Nhận Lấy Hàng</h1>
        <p className="text-muted-foreground mt-1">Xác nhận những đơn hàng mới được lấy từ khách hàng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
              <p className="text-3xl font-bold mt-1">{pendingCount}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-amber-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng cộng</p>
              <p className="text-3xl font-bold mt-1">{orders.length}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đang xác nhận</p>
              <p className="text-3xl font-bold mt-1">{confirmingOrders.size}</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white border border-dashed border-border rounded-lg p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold">Không có đơn hàng chờ xác nhận</h3>
          <p className="text-muted-foreground mt-2">Tất cả đơn hàng đã được xác nhận lấy hàng</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-border rounded-lg overflow-hidden">
              {/* Order Header */}
              <div
                className="p-4 hover:bg-muted/50 cursor-pointer transition"
                onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono font-bold text-blue-600">{order.orderCode}</div>
                      <div className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        Chờ xác nhận
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {order.user?.profile?.company || 'N/A'} • {order.user?.profile?.fullName || 'Khách hàng'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {order.totalAmount ? `${order.totalAmount.toLocaleString('vi-VN')} ₫` : 'Chưa có giá trị'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.weightKg ? `${order.weightKg}kg` : 'Chưa khai báo'}
                    </div>
                  </div>
                </div>

                {/* Route Preview */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Từ</p>
                    <p className="font-medium">{order.origin}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-muted-foreground text-xs">→</div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Đến</p>
                    <p className="font-medium">{order.destination}</p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  Loại dịch vụ: {serviceTypeLabel(order.serviceType)}
                </div>
              </div>

              {/* Pickup Confirmation Form */}
              {selectedOrder === order.id && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSubmit(order.id)
                    }}
                    className="space-y-4"
                  >
                    {/* Location Input */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Địa điểm lấy hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Kho ABC, 123 Đường Lê Lợi, TP. HCM"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={confirmingOrders.has(order.id)}
                      />
                    </div>

                    {/* Pickup Date */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Ngày lấy hàng
                      </label>
                      <input
                        type="date"
                        value={formData.pickupTime}
                        onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={confirmingOrders.has(order.id)}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Ghi chú</label>
                      <textarea
                        placeholder="VD: Lấy qua cổng phía tây, liên hệ người phụ trách kho"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        disabled={confirmingOrders.has(order.id)}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-white border border-border rounded-lg hover:bg-muted transition disabled:opacity-50"
                        disabled={confirmingOrders.has(order.id)}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        disabled={confirmingOrders.has(order.id)}
                      >
                        {confirmingOrders.has(order.id) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Đang xác nhận...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Xác nhận lấy hàng
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
