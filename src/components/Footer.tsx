import Link from 'next/link'
import {
  Truck,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
} from 'lucide-react'

const footerLinks = {
  services: [
    { name: 'Vận tải nguyên xe (FTL)', href: '#' },
    { name: 'Vận tải ghép hàng (LTL)', href: '#' },
    { name: 'Dịch vụ 3PL', href: '#' },
    { name: 'Chuyển phát nhanh', href: '#' },
    { name: 'Vận tải lạnh', href: '#' },
  ],
  company: [
    { name: 'Về chúng tôi', href: '#' },
    { name: 'Đội ngũ', href: '#' },
    { name: 'Tuyển dụng', href: '#' },
    { name: 'Tin tức', href: '#' },
    { name: 'Liên hệ', href: '#lien-he' },
  ],
  support: [
    { name: 'Tra cứu đơn hàng', href: '#' },
    { name: 'Hướng dẫn sử dụng', href: '#' },
    { name: 'Câu hỏi thường gặp', href: '#' },
    { name: 'Chính sách bồi thường', href: '#' },
    { name: 'Điều khoản sử dụng', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[hsl(215,25%,12%)] text-white relative" id="lien-he">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-brand" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-brand rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-xl font-bold font-(family-name:--font-display) tracking-tight">
                  VietExpress
                </span>
              </div>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed">
              Giải pháp vận tải nội địa toàn diện cho doanh nghiệp vừa và nhỏ tại
              Việt Nam. Uy tín — Nhanh chóng — An toàn.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Phone className="w-4 h-4 text-brand shrink-0" style={{ color: 'hsl(0 75% 55%)' }} />
                <span>1900 6868</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Mail className="w-4 h-4 shrink-0" style={{ color: 'hsl(0 75% 55%)' }} />
                <span>info@vietexpress.vn</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-white/70">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'hsl(0 75% 55%)' }} />
                <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3">
              {[Phone, Mail, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Icon className="w-4 h-4 text-white/80" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-bold font-(family-name:--font-display) uppercase tracking-wider mb-5 text-white/90">
              Dịch vụ
            </h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold font-(family-name:--font-display) uppercase tracking-wider mb-5 text-white/90">
              Công ty
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold font-(family-name:--font-display) uppercase tracking-wider mb-5 text-white/90">
              Hỗ trợ
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © 2026 VietExpress Logistics. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/dang-nhap" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Đăng nhập nhân viên
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/dang-nhap" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              Đăng nhập khách hàng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
