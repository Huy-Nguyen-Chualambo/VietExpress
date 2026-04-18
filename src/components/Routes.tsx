'use client'

import { useEffect, useRef } from 'react'
import { MapPin, ArrowRight, Clock, Truck } from 'lucide-react'

const routes = [
  {
    region: 'Miền Bắc',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    routes: [
      { from: 'Hà Nội', to: 'Hải Phòng', time: '2-3h', distance: '120km' },
      { from: 'Hà Nội', to: 'Quảng Ninh', time: '3-4h', distance: '180km' },
      { from: 'Hà Nội', to: 'Lào Cai', time: '5-6h', distance: '340km' },
      { from: 'Hà Nội', to: 'Ninh Bình', time: '2h', distance: '95km' },
    ],
  },
  {
    region: 'Miền Trung',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    routes: [
      { from: 'Đà Nẵng', to: 'Huế', time: '2-3h', distance: '100km' },
      { from: 'Đà Nẵng', to: 'Quảng Nam', time: '1-2h', distance: '65km' },
      { from: 'Đà Nẵng', to: 'Nha Trang', time: '8-10h', distance: '530km' },
      { from: 'Huế', to: 'Quảng Bình', time: '3-4h', distance: '170km' },
    ],
  },
  {
    region: 'Miền Nam',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    routes: [
      { from: 'TP.HCM', to: 'Bình Dương', time: '1h', distance: '30km' },
      { from: 'TP.HCM', to: 'Đồng Nai', time: '1-2h', distance: '35km' },
      { from: 'TP.HCM', to: 'Cần Thơ', time: '3-4h', distance: '170km' },
      { from: 'TP.HCM', to: 'Vũng Tàu', time: '2h', distance: '100km' },
    ],
  },
  {
    region: 'Liên vùng',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    routes: [
      { from: 'Hà Nội', to: 'TP.HCM', time: '36-48h', distance: '1,730km' },
      { from: 'Hà Nội', to: 'Đà Nẵng', time: '16-20h', distance: '770km' },
      { from: 'TP.HCM', to: 'Đà Nẵng', time: '18-24h', distance: '960km' },
      { from: 'Hải Phòng', to: 'TP.HCM', time: '40-48h', distance: '1,800km' },
    ],
  },
]

export default function Routes() {
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
      className="py-20 md:py-28 bg-gradient-hero relative"
      id="tuyen-duong"
    >
      {/* Decorative */}
      <div className="absolute inset-0 dotted-bg opacity-20" />

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="reveal opacity-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-soft border border-brand/10 mb-6">
            <MapPin className="w-4 h-4 text-brand" />
            <span className="text-sm font-medium text-brand">Tuyến đường</span>
          </div>
          <h2 className="reveal opacity-0 text-3xl sm:text-4xl lg:text-5xl font-bold font-(family-name:--font-display) tracking-tight mb-4">
            Phủ sóng{' '}
            <span className="text-gradient-brand">Bắc — Trung — Nam</span>
          </h2>
          <p className="reveal opacity-0 text-lg text-muted-foreground">
            Mạng lưới vận tải rộng khắp 63 tỉnh thành với hàng trăm tuyến đường
          </p>
        </div>

        {/* Routes Grid */}
        <div className="grid sm:grid-cols-2 gap-7 lg:gap-8">
          {routes.map((region, regionIndex) => (
            <div
              key={region.region}
              className="reveal opacity-0 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-border/50"
              style={{ animationDelay: `${regionIndex * 150}ms` }}
            >
              {/* Region Header */}
              <div
                className={`bg-gradient-to-r ${region.color} px-6 py-4 flex items-center gap-3`}
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-(family-name:--font-display)">
                    {region.region}
                  </h3>
                  <p className="text-sm text-white/70">{region.routes.length} tuyến phổ biến</p>
                </div>
              </div>

              {/* Routes List */}
              <div className="p-4 space-y-2">
                {region.routes.map((route) => (
                  <div
                    key={`${route.from}-${route.to}`}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl ${region.bgColor} hover:scale-[1.02] transition-transform cursor-default`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <MapPin className={`w-3.5 h-3.5 ${region.textColor}`} />
                      {route.from}
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      {route.to}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.time}
                      </span>
                      <span className="font-medium">{route.distance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
