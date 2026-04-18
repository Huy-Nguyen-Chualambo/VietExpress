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
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Cai dat</p>
        <h1 className="text-2xl font-bold font-display">Thong tin tai khoan nhan vien</h1>
        <p className="text-sm text-muted-foreground mt-2">Trang tong hop thong tin nhan vien va cac chi so he thong de dieu phoi.</p>
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
            <Settings className="w-5 h-5 text-brand" />
          </div>
          <h2 className="text-base font-semibold font-display">Tai khoan</h2>
          <div className="text-sm text-muted-foreground">Ho ten: {employeeProfile?.fullName || session.user.name || 'Nhan vien'}</div>
          <div className="text-sm text-muted-foreground">Email: {session.user.email || employeeProfile?.email || 'Khong co'}</div>
          <div className="text-sm text-muted-foreground">Vai tro: {employeeProfile?.role || 'employee'}</div>
        </div>

        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-base font-semibold font-display">Canh bao he thong</h2>
          <div className="text-sm text-muted-foreground">Thong bao chua doc: {unreadNotifications}</div>
          <div className="text-sm text-muted-foreground">Tong van don: {totalOrders}</div>
          <div className="text-sm text-muted-foreground">Tong bao gia: {totalQuotes}</div>
        </div>

        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-base font-semibold font-display">Bao mat va du lieu</h2>
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Database className="w-4 h-4" />
            Nguon du lieu: Prisma + PostgreSQL
          </div>
          <div className="text-sm text-muted-foreground">Phan quyen truy cap dashboard theo role employee.</div>
        </div>
      </section>
    </div>
  )
}
