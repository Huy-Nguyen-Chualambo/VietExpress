import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import { Settings, ShieldCheck, Bell, Database } from 'lucide-react'

export default async function EmployeeSettingsPage() {
  const session = await requireEmployeeSession()

  const [employeeProfile, unreadNotifications, totalOrders, totalQuotes] = await Promise.all([
    prisma.profile.findUnique({ where: { id: session.user.id } }),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.order.count(),
    prisma.quoteRequest.count(),
  ])

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-border/50 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Cài đặt</p>
        <h1 className="text-2xl font-bold font-display">Thông tin tài khoản nhân viên</h1>
        <p className="text-sm text-muted-foreground mt-2">Trang tổng hợp thông tin nhân viên và các chỉ số hệ thống để điều phối.</p>
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
            <Settings className="w-5 h-5 text-brand" />
          </div>
          <h2 className="text-base font-semibold font-display">Tài khoản</h2>
          <div className="text-sm text-muted-foreground">Họ tên: {employeeProfile?.fullName || session.user.name || 'Nhân viên'}</div>
          <div className="text-sm text-muted-foreground">Email: {session.user.email || employeeProfile?.email || 'Không có'}</div>
          <div className="text-sm text-muted-foreground">Vai trò: {employeeProfile?.role || 'employee'}</div>
        </div>

        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-base font-semibold font-display">Cảnh báo hệ thống</h2>
          <div className="text-sm text-muted-foreground">Thông báo chưa đọc: {unreadNotifications}</div>
          <div className="text-sm text-muted-foreground">Tổng vận đơn: {totalOrders}</div>
          <div className="text-sm text-muted-foreground">Tổng báo giá: {totalQuotes}</div>
        </div>

        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-base font-semibold font-display">Bảo mật và dữ liệu</h2>
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Database className="w-4 h-4" />
            Nguồn dữ liệu: Prisma + PostgreSQL
          </div>
          <div className="text-sm text-muted-foreground">Phân quyền truy cập dashboard theo role employee.</div>
        </div>
      </section>
    </div>
  )
}
