'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Truck,
  Package,
  Clock,
  Shield,
  MapPin,
  ArrowRight,
  Star,
  Zap,
} from 'lucide-react'

const floatingCards = [
  {
    icon: Package,
    label: 'Đang giao',
    detail: 'HCM → Hà Nội',
    color: 'text-brand',
    bg: 'bg-brand-soft',
    delay: 'delay-0',
  },
  {
    icon: Clock,
    label: '24h',
    detail: 'Express',
    color: 'text-gold',
    bg: 'bg-gold-soft',
    delay: 'delay-200',
  },
  {
    icon: Shield,
    label: 'Bảo hiểm',
    detail: '100% hàng hóa',
    color: 'text-green-600',
    bg: 'bg-green-50',
    delay: 'delay-400',
  },
  {
    icon: MapPin,
    label: '63 tỉnh',
    detail: 'Phủ sóng toàn quốc',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    delay: 'delay-600',
  },
]

const stats = [
  { value: '10,000+', label: 'Đơn hàng mỗi tháng' },
  { value: '63', label: 'Tỉnh thành phủ sóng' },
  { value: '99.5%', label: 'Tỷ lệ giao thành công' },
  { value: '24/7', label: 'Hỗ trợ khách hàng' },
]

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up')
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = sectionRef.current?.querySelectorAll('.reveal')
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden pt-20"
      id="hero"
    >
      {/* Dotted background */}
      <div className="absolute inset-0 dotted-bg opacity-40" />

      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-brand/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-8 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="reveal opacity-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-soft border border-brand/10">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-sm font-medium text-brand">
                #1 Logistics nội địa Việt Nam
              </span>
            </div>

            {/* Heading */}
            <h1 className="reveal opacity-0 text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.1] tracking-tight">
              Vận chuyển hàng hóa{' '}
              <span className="text-gradient-brand">nhanh chóng</span>
              <br />
              <span className="text-gradient-gold">an toàn</span> khắp Việt Nam
            </h1>

            {/* Description */}
            <p className="reveal opacity-0 text-lg text-muted-foreground max-w-lg leading-relaxed">
              VietExpress cung cấp giải pháp vận tải nội địa toàn diện cho doanh nghiệp
              vừa và nhỏ. Từ FTL, LTL đến chuyển phát nhanh — tất cả trong một nền tảng.
            </p>

            {/* CTA Buttons */}
            <div className="reveal opacity-0 flex flex-wrap gap-4">
              <Link
                href="#bao-gia"
                className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-brand rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-pulse-glow"
              >
                <Zap className="w-5 h-5" />
                Báo giá ngay
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#dich-vu"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-foreground bg-white border-2 border-border rounded-xl hover:border-brand hover:text-brand hover:bg-brand-soft transition-all duration-300"
              >
                Khám phá dịch vụ
              </Link>
            </div>

            {/* Stats */}
            <div className="reveal opacity-0 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <div className="text-2xl font-bold font-display text-gradient-brand">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column — Floating Cards */}
          <div className="relative hidden lg:block">
            {/* Central Truck illustration */}
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-brand opacity-5 rounded-full blur-3xl animate-pulse" />

              {/* Center circle */}
              <div className="absolute inset-[15%] rounded-full border-2 border-dashed border-brand/20 animate-spin-slow" />
              <div className="absolute inset-[30%] rounded-full border border-gold/20" />

              {/* Central icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-brand rounded-2xl shadow-xl flex items-center justify-center animate-float">
                  <Truck className="w-12 h-12 text-white" strokeWidth={1.5} />
                </div>
              </div>

              {/* Star decorations */}
              <Star className="absolute top-[10%] right-[20%] w-4 h-4 text-gold animate-pulse" />
              <Star className="absolute bottom-[15%] left-[15%] w-3 h-3 text-brand animate-pulse delay-300" />
              <Star className="absolute top-[40%] left-[5%] w-5 h-5 text-gold/50 animate-pulse delay-500" />

              {/* Floating cards */}
              {floatingCards.map((card, i) => {
                const positions = [
                  'top-[5%] left-[5%]',
                  'top-[8%] right-[0%]',
                  'bottom-[15%] right-[0%]',
                  'bottom-[5%] left-[5%]',
                ]
                return (
                  <div
                    key={card.label}
                    className={`absolute ${positions[i]} animate-float ${card.delay} glass rounded-xl px-4 py-3 shadow-md border border-white/30 hover:shadow-lg transition-shadow cursor-default`}
                    style={{ animationDelay: `${i * 0.8}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}
                      >
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {card.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {card.detail}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full h-auto fill-white">
          <path d="M0,40 C360,80 720,0 1440,40 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  )
}

