'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Truck, ChevronDown, User, LogIn } from 'lucide-react'

const navigation = [
  { name: 'Trang chủ', href: '/' },
  {
    name: 'Dịch vụ',
    href: '#dich-vu',
    children: [
      { name: 'Vận tải nguyên xe (FTL)', href: '#ftl' },
      { name: 'Vận tải ghép hàng (LTL)', href: '#ltl' },
      { name: 'Dịch vụ 3PL', href: '#3pl' },
      { name: 'Chuyển phát nhanh', href: '#express' },
      { name: 'Vận tải lạnh', href: '#cold' },
      { name: 'Chứng từ & Thủ tục', href: '#doc' },
    ],
  },
  { name: 'Tuyến đường', href: '#tuyen-duong' },
  { name: 'Báo giá', href: '#bao-gia' },
  { name: 'Liên hệ', href: '#lien-he' },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 bg-gradient-brand rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Truck className="w-5 h-5 text-white" strokeWidth={2.5} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-gold rounded-full border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-display tracking-tight text-gradient-brand">
                VietExpress
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1 tracking-widest uppercase">
                Logistics
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.name)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-brand hover:bg-brand-soft transition-all duration-200"
                >
                  {item.name}
                  {item.children && (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                  )}
                </Link>

                {/* Dropdown */}
                {item.children && openDropdown === item.name && (
                  <div className="absolute top-full left-0 mt-1 w-64 glass rounded-xl shadow-lg border border-white/20 py-2 animate-fade-up">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-foreground/70 hover:text-brand hover:bg-brand-soft/50 transition-colors"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/dang-nhap"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-brand transition-colors rounded-lg hover:bg-brand-soft"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </Link>
            <Link
              href="/dang-ky"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-brand rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <User className="w-4 h-4" />
              Đăng ký
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-brand-soft transition-colors"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="lg:hidden glass border-t border-white/20 animate-fade-up">
          <div className="max-w-[1400px] mx-auto px-6 py-4 space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => !item.children && setIsMobileOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:text-brand hover:bg-brand-soft transition-colors"
                >
                  {item.name}
                </Link>
                {item.children && (
                  <div className="ml-4 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={() => setIsMobileOpen(false)}
                        className="block px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-brand hover:bg-brand-soft/50 transition-colors"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-border space-y-2">
              <Link
                href="/dang-nhap"
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-border hover:bg-brand-soft transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </Link>
              <Link
                href="/dang-ky"
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-brand rounded-lg"
              >
                <User className="w-4 h-4" />
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

