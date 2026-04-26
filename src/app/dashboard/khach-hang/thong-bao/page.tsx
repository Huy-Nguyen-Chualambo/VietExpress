import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  formatDateTime,
  getCustomerNotifications,
  notificationTypeClass,
  notificationTypeLabel,
} from '@/lib/customer-portal'
import { Bell, CheckCheck, MailOpen, Package, AlertTriangle, Info } from 'lucide-react'

async function markAllNotificationsRead() {
  'use server'

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  })

  revalidatePath('/dashboard/khach-hang/thong-bao')
  revalidatePath('/dashboard/khach-hang')
}

const typeIcons = {
  info: Info,
  success: CheckCheck,
  warning: AlertTriangle,
  error: Bell,
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const { notifications } = await getCustomerNotifications(session.user.id)
  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-border/50 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Thông báo
            </p>
            <h1 className="text-2xl font-bold font-display">
              Trung tâm thông báo của bạn
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Tất cả thông báo đều được lấy từ cơ sở dữ liệu. Bạn có thể đánh dấu đã
              đọc ngay trên màn hình này.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-semibold">
              <MailOpen className="w-4 h-4" />
              {unreadCount} chưa đọc
            </div>
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Đánh dấu đã đọc
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold font-display">
            Danh sách thông báo
          </h2>
          <Bell className="w-4 h-4 text-muted-foreground" />
        </div>

        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có thông báo nào</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Khi có cập nhật thật từ hệ thống vận hành, thông báo sẽ hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info
              return (
                <article
                  key={notification.id}
                  className={`p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${notification.isRead ? 'opacity-80' : 'bg-brand-soft/20'}`}
                >
                  <div className="flex gap-4">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${notificationTypeClass(notification.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold font-display">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="px-2 py-1 rounded-full bg-brand text-white text-[11px] font-semibold">
                            Mới
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${notificationTypeClass(notification.type)}`}>
                          {notificationTypeLabel(notification.type)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right text-sm text-muted-foreground">
                    {notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-brand" />
            <h3 className="font-semibold font-display">Đơn vận chuyển</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Cập nhật về trạng thái giao nhận và hành trình đơn hàng.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <MailOpen className="w-4 h-4 text-brand" />
            <h3 className="font-semibold font-display">Báo giá</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Phản hồi từ đội ngũ kinh doanh khi báo giá được tạo hoặc cập nhật.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCheck className="w-4 h-4 text-brand" />
            <h3 className="font-semibold font-display">Hệ thống</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Thông báo từ hồ sơ, cài đặt và các tác vụ vận hành nội bộ.
          </p>
        </div>
      </section>
    </div>
  )
}

