import { prisma } from '@/lib/prisma'
import { requireEmployeeSession } from '@/lib/employee-portal'
import { Users, Phone, Mail, Building2 } from 'lucide-react'

export default async function EmployeeCustomersPage() {
  await requireEmployeeSession()

  const customers = await prisma.profile.findMany({
    where: { role: 'customer' },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          email: true,
          _count: {
            select: {
              orders: true,
              quoteRequests: true,
              notifications: true,
            },
          },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-border/50 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Khach hang</p>
        <h1 className="text-2xl font-bold font-display">Danh sach khach hang</h1>
        <p className="text-sm text-muted-foreground mt-2">Tong quan thong tin lien he va muc do su dung dich vu cua tung khach hang.</p>
      </section>

      <section className="bg-white rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold font-display">Khach hang hien co</h2>
          <span className="text-sm text-muted-foreground">{customers.length} tai khoan</span>
        </div>

        {customers.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground text-center">Chua co khach hang nao.</div>
        ) : (
          <div className="divide-y divide-border">
            {customers.map((customer) => (
              <article key={customer.id} className="p-6 space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand" />
                      <span className="text-sm font-semibold">{customer.fullName || 'Khach hang'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{customer.user.email || customer.email}</span>
                      <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone || 'Chua cap nhat'}</span>
                      <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{customer.company || 'Khong co cong ty'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>{customer.user._count.orders} don hang</div>
                    <div>{customer.user._count.quoteRequests} bao gia</div>
                    <div>{customer.user._count.notifications} thong bao</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
