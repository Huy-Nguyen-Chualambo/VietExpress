'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Truck,
  LayoutDashboard,
  Package,
  FileText,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
} from 'lucide-react'

const customerNav = [
  { name: 'Tổng quan', href: '/dashboard/khach-hang', icon: LayoutDashboard },
  { name: 'Đơn hàng', href: '/dashboard/khach-hang/don-hang', icon: Package },
  { name: 'Báo giá', href: '/dashboard/khach-hang/bao-gia', icon: FileText },
  { name: 'Theo dõi', href: '/dashboard/khach-hang/theo-doi', icon: MapPin },
  { name: 'Thông báo', href: '/dashboard/khach-hang/thong-bao', icon: Bell },
  { name: 'Cài đặt', href: '/dashboard/khach-hang/cai-dat', icon: Settings },
]

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border shadow-sm transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-brand rounded-lg flex items-center justify-center">
                <Truck className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-lg font-bold font-(family-name:--font-display) text-gradient-brand">
                  VietExpress
                </span>
                <div className="text-[9px] text-muted-foreground -mt-0.5 tracking-widest uppercase">
                  Khách hàng
                </div>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {customerNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-soft text-brand shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-brand' : ''}`} />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto text-brand" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-brand-soft flex items-center justify-center">
                <User className="w-4 h-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {session?.user?.name || 'Khách hàng'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {session?.user?.email || 'customer@vietexpress.vn'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-border flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1">
            <h2 className="text-lg font-semibold font-(family-name:--font-display)">
              {customerNav.find((n) => n.href === pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
