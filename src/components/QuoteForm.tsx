'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Send,
  MapPin,
  Package,
  Truck,
  Phone,
  Mail,
  User,
  Weight,
  Ruler,
  FileText,
} from 'lucide-react'

const serviceOptions = [
  { value: 'ftl', label: 'Vận tải nguyên xe (FTL)' },
  { value: 'ltl', label: 'Vận tải ghép hàng (LTL)' },
  { value: '3pl', label: 'Dịch vụ 3PL' },
  { value: 'express', label: 'Chuyển phát nhanh' },
  { value: 'cold', label: 'Vận tải lạnh' },
  { value: 'doc', label: 'Chứng từ & Thủ tục' },
]

export default function QuoteForm() {
  const sectionRef = useRef<HTMLElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    service: '',
    from: '',
    to: '',
    weight: '',
    dimensions: '',
    note: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)

    setTimeout(() => setIsSubmitted(false), 5000)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 bg-white relative"
      id="bao-gia"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Left – Info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="reveal opacity-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-soft border border-brand/10 mb-6">
                <FileText className="w-4 h-4 text-brand" />
                <span className="text-sm font-medium text-brand">Báo giá</span>
              </div>
              <h2 className="reveal opacity-0 text-3xl sm:text-4xl font-bold font-(family-name:--font-display) tracking-tight mb-4">
                Nhận báo giá{' '}
                <span className="text-gradient-brand">miễn phí</span>
              </h2>
              <p className="reveal opacity-0 text-muted-foreground leading-relaxed">
                Điền thông tin bên dưới để nhận báo giá chi tiết. Đội ngũ tư vấn của
                VietExpress sẽ liên hệ bạn trong vòng 30 phút.
              </p>
            </div>

            {/* Contact info cards */}
            <div className="reveal opacity-0 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-brand-soft rounded-xl border border-brand/10">
                <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Hotline 24/7</div>
                  <div className="text-lg font-bold text-foreground">1900 6868</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gold-soft rounded-xl border border-gold/20">
                <div className="w-12 h-12 bg-gradient-gold rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="text-lg font-bold text-foreground">
                    info@vietexpress.vn
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted rounded-xl border border-border/50">
                <div className="w-12 h-12 bg-foreground rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Trụ sở chính</div>
                  <div className="text-sm font-semibold text-foreground">
                    123 Nguyễn Huệ, Q.1, TP.HCM
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right – Form */}
          <div className="lg:col-span-3">
            <div className="reveal opacity-0 bg-white rounded-2xl shadow-lg border border-border/50 p-8">
              {isSubmitted ? (
                <div className="text-center py-12 space-y-4 animate-fade-up">
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold font-(family-name:--font-display) text-green-700">
                    Gửi thành công!
                  </h3>
                  <p className="text-muted-foreground">
                    Chúng tôi sẽ liên hệ bạn trong vòng 30 phút.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                        <User className="w-3.5 h-3.5 text-brand" />
                        Họ và tên <span className="text-brand">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                        <Phone className="w-3.5 h-3.5 text-brand" />
                        Số điện thoại <span className="text-brand">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0901 234 567"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                        <Mail className="w-3.5 h-3.5 text-brand" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@company.com"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Company */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                        <Package className="w-3.5 h-3.5 text-brand" />
                        Công ty
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Tên công ty"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Service */}
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                      <Truck className="w-3.5 h-3.5 text-brand" />
                      Dịch vụ cần báo giá <span className="text-brand">*</span>
                    </label>
                    <select
                      name="service"
                      required
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm focus:bg-white transition-colors"
                    >
                      <option value="">Chọn dịch vụ</option>
                      {serviceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* From / To */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5 text-green-500" />
                        Điểm gửi <span className="text-brand">*</span>
                      </label>
                      <input
                        type="text"
                        name="from"
                        required
                        value={formData.from}
                        onChange={handleChange}
                        placeholder="TP. Hồ Chí Minh"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5 text-brand" />
                        Điểm nhận <span className="text-brand">*</span>
                      </label>
                      <input
                        type="text"
                        name="to"
                        required
                        value={formData.to}
                        onChange={handleChange}
                        placeholder="Hà Nội"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Weight / Dimensions */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                        <Weight className="w-3.5 h-3.5 text-brand" />
                        Trọng lượng (kg)
                      </label>
                      <input
                        type="text"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="VD: 500kg"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                        <Ruler className="w-3.5 h-3.5 text-brand" />
                        Kích thước (DxRxC)
                      </label>
                      <input
                        type="text"
                        name="dimensions"
                        value={formData.dimensions}
                        onChange={handleChange}
                        placeholder="VD: 120x80x100 cm"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                      <FileText className="w-3.5 h-3.5 text-brand" />
                      Ghi chú
                    </label>
                    <textarea
                      name="note"
                      rows={3}
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Mô tả thêm về hàng hóa, yêu cầu đặc biệt..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-brand rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Gửi yêu cầu báo giá
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
