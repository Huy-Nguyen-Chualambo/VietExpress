'use client'

import { useEffect, useRef } from 'react'
import {
  Truck,
  PackageCheck,
  Warehouse,
  Zap,
  Snowflake,
  FileText,
} from 'lucide-react'

const services = [
  {
    icon: Truck,
    title: 'Vận tải nguyên xe (FTL)',
    description:
      'Dịch vụ vận chuyển nguyên xe tải cho lô hàng lớn. Đảm bảo thời gian giao hàng nhanh chóng với đội xe hiện đại.',
    stamp: 'FTL',
    features: ['Xe 1T - 25T', 'GPS tracking', 'Bảo hiểm 100%'],
  },
  {
    icon: PackageCheck,
    title: 'Vận tải ghép hàng (LTL)',
    description:
      'Tiết kiệm chi phí bằng cách ghép nhiều lô hàng nhỏ trên cùng một chuyến xe. Phù hợp cho SME.',
    stamp: 'LTL',
    features: ['Từ 30kg', 'Giao tận nơi', 'Giá cạnh tranh'],
  },
  {
    icon: Warehouse,
    title: 'Dịch vụ 3PL',
    description:
      'Giải pháp logistics trọn gói: lưu kho, đóng gói, quản lý tồn kho và phân phối hàng hóa.',
    stamp: '3PL',
    features: ['Kho 5000m²', 'WMS hiện đại', 'Fulfillment'],
  },
  {
    icon: Zap,
    title: 'Chuyển phát nhanh',
    description:
      'Giao hàng siêu tốc trong 24h cho các tuyến chính. Theo dõi đơn hàng realtime.',
    stamp: 'EXP',
    features: ['24h giao hàng', 'COD', 'Realtime tracking'],
  },
  {
    icon: Snowflake,
    title: 'Vận tải lạnh',
    description:
      'Xe đông lạnh chuyên dụng cho thực phẩm, dược phẩm. Kiểm soát nhiệt độ chặt chẽ suốt hành trình.',
    stamp: 'COLD',
    features: ['-18°C đến 25°C', 'HACCP', 'Log nhiệt độ'],
  },
  {
    icon: FileText,
    title: 'Chứng từ & Thủ tục',
    description:
      'Hỗ trợ đầy đủ chứng từ vận chuyển, bảo hiểm hàng hóa và các thủ tục pháp lý cần thiết.',
    stamp: 'DOC',
    features: ['E-Bill', 'Bảo hiểm', 'Hỗ trợ 24/7'],
  },
]

export default function Services() {
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
      className="py-20 md:py-28 bg-white relative"
      id="dich-vu"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="reveal opacity-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-soft border border-brand/10 mb-6">
            <span className="text-sm font-medium text-brand">Dịch vụ của chúng tôi</span>
          </div>
          <h2 className="reveal opacity-0 text-3xl sm:text-4xl lg:text-5xl font-bold font-(family-name:--font-display) tracking-tight mb-4">
            Giải pháp vận tải{' '}
            <span className="text-gradient-brand">toàn diện</span>
          </h2>
          <p className="reveal opacity-0 text-lg text-muted-foreground">
            Đa dạng dịch vụ đáp ứng mọi nhu cầu vận chuyển của doanh nghiệp bạn
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="reveal opacity-0 envelope-card group cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Envelope Icon */}
              <div className="envelope-icon">
                <service.icon className="w-5 h-5 text-brand" />
              </div>

              {/* Envelope Stamp */}
              <div className="envelope-stamp">
                <span className="text-[10px] font-bold text-white">
                  {service.stamp}
                </span>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 relative z-10">
                <h3 className="text-lg font-bold font-(family-name:--font-display) mb-2 group-hover:text-brand transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {service.description}
                </p>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-brand-soft text-brand/80 border border-brand/10"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
