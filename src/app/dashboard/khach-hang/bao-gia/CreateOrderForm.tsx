'use client'

import { useState } from 'react'
import { Send, MapPin, Package, Truck, Weight, FileText, Calculator, HelpCircle, Ruler } from 'lucide-react'
import { provinces, getDistricts, getWards } from '@/lib/locations'

const serviceOptions = [
  { value: 'ftl', label: 'Vận tải nguyên xe (FTL)' },
  { value: 'ltl', label: 'Vận tải ghép hàng (LTL)' },
  { value: '3pl', label: 'Dịch vụ 3PL' },
  { value: 'express', label: 'Chuyển phát nhanh' },
  { value: 'cold', label: 'Vận tải lạnh' },
  { value: 'doc', label: 'Chứng từ & Thủ tục' },
]

const regionNorth = new Set([
  'Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Bắc Ninh', 'Hưng Yên', 'Hải Dương', 'Thái Bình', 
  'Nam Định', 'Ninh Bình', 'Hà Nam', 'Hòa Bình', 'Sơn La', 'Điện Biên', 'Lào Cai', 
  'Yên Bái', 'Tuyên Quang', 'Phú Thọ', 'Vĩnh Phúc', 'Bắc Giang', 'Lạng Sơn', 'Cao Bằng', 
  'Bắc Kạn', 'Thái Nguyên', 'Hà Tĩnh'
].map(s => s.toLowerCase()))

const regionCentral = new Set([
  'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 
  'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận'
].map(s => s.toLowerCase()))

const regionSouth = new Set([
  'Gia Lai', 'Kon Tum', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng', 'TP. Hồ Chí Minh', 'TP Hồ Chí Minh',
  'Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa Vũng Tàu', 'Tây Ninh', 'Bình Phước', 
  'Long An', 'Tiền Giang', 'Bến Tre', 'Vĩnh Long', 'Trà Vinh', 'Đồng Tháp', 'An Giang', 
  'Kiên Giang', 'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau'
].map(s => s.toLowerCase()))

function getRegion(province: string): 'Bắc' | 'Trung' | 'Nam' | null {
  const p = province.trim().toLowerCase()
  if (regionNorth.has(p)) return 'Bắc'
  if (regionCentral.has(p)) return 'Trung'
  if (regionSouth.has(p)) return 'Nam'
  return null
}

interface PriceBreakdown {
  routeType: string
  baseWeight: number
  basePrice: number
  extraWeight: number
  extraSteps: number
  extraCharge: number
  total: number
}

export function calculateShippingFee(
  fromProv: string,
  toProv: string,
  weightKg: number
): PriceBreakdown {
  const from = fromProv.trim().toLowerCase()
  const to = toProv.trim().toLowerCase()
  
  // 1. Nội Tỉnh
  if (from === to) {
    const isSpecialCities = 
      from.includes('hà nội') || 
      from.includes('hồ chí minh') || 
      from.includes('tp. hcm') || 
      from.includes('hanoi') || 
      from.includes('ho chi minh')
      
    const baseWeight = 3
    const basePrice = isSpecialCities ? 21000 : 15500
    const additionalPrice = 2500
    
    if (weightKg <= baseWeight) {
      return {
        routeType: isSpecialCities ? 'Nội tỉnh (Hà Nội / TP.HCM)' : 'Nội tỉnh',
        baseWeight,
        basePrice,
        extraWeight: 0,
        extraSteps: 0,
        extraCharge: 0,
        total: basePrice,
      }
    } else {
      const extraWeight = weightKg - baseWeight
      const extraSteps = Math.ceil(extraWeight / 0.5)
      const extraCharge = extraSteps * additionalPrice
      return {
        routeType: isSpecialCities ? 'Nội tỉnh (Hà Nội / TP.HCM)' : 'Nội tỉnh',
        baseWeight,
        basePrice,
        extraWeight,
        extraSteps,
        extraCharge,
        total: basePrice + extraCharge,
      }
    }
  }
  
  // Khác tỉnh -> Tính vùng miền
  const r1 = getRegion(fromProv)
  const r2 = getRegion(toProv)
  const baseWeight = 0.5
  
  let routeType = 'Liên tỉnh'
  let basePrice = 29000
  let additionalPrice = 5000
  
  if (r1 && r2) {
    if (r1 === r2) {
      // Nội vùng
      routeType = 'Nội vùng'
      basePrice = 29000
      additionalPrice = 2500
    } else {
      const pair = [r1, r2].sort().join('-')
      if (pair === 'Bắc-Nam') {
        // Liên tỉnh cực (Bắc - Nam)
        routeType = 'Liên tỉnh Bắc - Nam'
        basePrice = 29000
        additionalPrice = 5000
      } else {
        // Liên vùng (Bắc-Trung, Nam-Trung)
        routeType = 'Liên vùng'
        basePrice = 29000
        additionalPrice = 5000
      }
    }
  } else {
    // Fallback if region mapping is incomplete
    basePrice = 29000
    additionalPrice = 5000
  }
  
  if (weightKg <= baseWeight) {
    return {
      routeType,
      baseWeight,
      basePrice,
      extraWeight: 0,
      extraSteps: 0,
      extraCharge: 0,
      total: basePrice,
    }
  } else {
    const extraWeight = weightKg - baseWeight
    const extraSteps = Math.ceil(extraWeight / 0.5)
    const extraCharge = extraSteps * additionalPrice
    return {
      routeType,
      baseWeight,
      basePrice,
      extraWeight,
      extraSteps,
      extraCharge,
      total: basePrice + extraCharge,
    }
  }
}

interface CreateOrderFormProps {
  onSubmitAction: (formData: FormData) => Promise<void>
}

export default function CreateOrderForm({ onSubmitAction }: CreateOrderFormProps) {
  const [formData, setFormData] = useState({
    serviceType: '',
    fromProvince: '',
    fromDistrict: '',
    fromWard: '',
    toProvince: '',
    toDistrict: '',
    toWard: '',
    weightKg: '',
    dimensions: '',
    note: '',
  })

  const [priceResult, setPriceResult] = useState<PriceBreakdown | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setValidationError('')
    const { name, value } = e.target

    if (name === 'fromProvince') {
      setFormData((prev) => ({ ...prev, fromProvince: value, fromDistrict: '', fromWard: '' }))
      setPriceResult(null)
      return
    }
    if (name === 'fromDistrict') {
      setFormData((prev) => ({ ...prev, fromDistrict: value, fromWard: '' }))
      setPriceResult(null)
      return
    }
    if (name === 'toProvince') {
      setFormData((prev) => ({ ...prev, toProvince: value, toDistrict: '', toWard: '' }))
      setPriceResult(null)
      return
    }
    if (name === 'toDistrict') {
      setFormData((prev) => ({ ...prev, toDistrict: value, toWard: '' }))
      setPriceResult(null)
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    setPriceResult(null)
  }

  const runPriceCalculation = () => {
    setValidationError('')
    if (!formData.fromProvince || !formData.toProvince) {
      setValidationError('Vui lòng chọn cả điểm gửi và điểm nhận.')
      return
    }
    const weight = Number(formData.weightKg)
    if (isNaN(weight) || weight <= 0) {
      setValidationError('Vui lòng nhập trọng lượng hợp lệ (> 0 kg).')
      return
    }

    setIsCalculating(true)
    setTimeout(() => {
      try {
        const breakdown = calculateShippingFee(
          formData.fromProvince,
          formData.toProvince,
          weight
        )
        setPriceResult(breakdown)
      } catch (err) {
        setValidationError('Đã có lỗi xảy ra khi tính giá.')
      } finally {
        setIsCalculating(false)
      }
    }, 400)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setValidationError('')

    // Validate inputs
    if (!formData.serviceType) {
      setValidationError('Vui lòng chọn dịch vụ.')
      return
    }
    if (!formData.fromProvince || !formData.fromDistrict) {
      setValidationError('Vui lòng chọn đầy đủ Điểm gửi.')
      return
    }
    if (!formData.toProvince || !formData.toDistrict) {
      setValidationError('Vui lòng chọn đầy đủ Điểm nhận.')
      return
    }
    const weight = Number(formData.weightKg)
    if (isNaN(weight) || weight <= 0) {
      setValidationError('Vui lòng nhập trọng lượng hợp lệ (> 0 kg).')
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate final pricing before submitting
      const finalPrice = calculateShippingFee(
        formData.fromProvince,
        formData.toProvince,
        weight
      )

      const submitData = new FormData()
      submitData.append('serviceType', formData.serviceType)
      submitData.append('fromProvince', formData.fromProvince)
      submitData.append('fromDistrict', formData.fromDistrict)
      submitData.append('fromWard', formData.fromWard)
      submitData.append('toProvince', formData.toProvince)
      submitData.append('toDistrict', formData.toDistrict)
      submitData.append('toWard', formData.toWard)
      submitData.append('weightKg', String(weight))
      submitData.append('totalAmount', String(finalPrice.total))
      submitData.append('dimensions', formData.dimensions)
      submitData.append('note', formData.note)
      submitData.append('executionMode', 'manual')

      await onSubmitAction(submitData)
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Tạo đơn thất bại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fromDistricts = getDistricts(formData.fromProvince)
  const fromWards = getWards(formData.fromDistrict)
  const toDistricts = getDistricts(formData.toProvince)
  const toWards = getWards(formData.toDistrict)

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center">
          <Truck className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h2 className="text-base font-semibold font-display">Tạo đơn gửi mới</h2>
          <p className="text-sm text-muted-foreground">Địa chỉ chi tiết và tự động tính cự ly SLA</p>
        </div>
      </div>

      {validationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service Options */}
        <div>
          <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-brand" /> Dịch vụ
          </label>
          <select
            name="serviceType"
            required
            value={formData.serviceType}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
          >
            <option value="">Chọn dịch vụ</option>
            {serviceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Origin cascading select */}
        <div className="space-y-2">
          <label className="block text-sm font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-green-600" /> Điểm gửi (Người gửi) <span className="text-brand">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <select
              name="fromProvince"
              required
              value={formData.fromProvince}
              onChange={handleInputChange}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-xs focus:ring-1 focus:ring-brand focus:border-brand"
            >
              <option value="">Tỉnh/Thành</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              name="fromDistrict"
              required
              value={formData.fromDistrict}
              onChange={handleInputChange}
              disabled={!formData.fromProvince}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-xs focus:ring-1 focus:ring-brand focus:border-brand disabled:opacity-50"
            >
              <option value="">Quận/Huyện</option>
              {fromDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              name="fromWard"
              value={formData.fromWard}
              onChange={handleInputChange}
              disabled={!formData.fromDistrict}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-xs focus:ring-1 focus:ring-brand focus:border-brand disabled:opacity-50"
            >
              <option value="">Phường/Xã</option>
              {fromWards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination cascading select */}
        <div className="space-y-2">
          <label className="block text-sm font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand" /> Điểm nhận (Người nhận) <span className="text-brand">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <select
              name="toProvince"
              required
              value={formData.toProvince}
              onChange={handleInputChange}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-xs focus:ring-1 focus:ring-brand focus:border-brand"
            >
              <option value="">Tỉnh/Thành</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              name="toDistrict"
              required
              value={formData.toDistrict}
              onChange={handleInputChange}
              disabled={!formData.toProvince}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-xs focus:ring-1 focus:ring-brand focus:border-brand disabled:opacity-50"
            >
              <option value="">Quận/Huyện</option>
              {toDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              name="toWard"
              value={formData.toWard}
              onChange={handleInputChange}
              disabled={!formData.toDistrict}
              className="rounded-xl border border-border bg-white px-3 py-2.5 text-xs focus:ring-1 focus:ring-brand focus:border-brand disabled:opacity-50"
            >
              <option value="">Phường/Xã</option>
              {toWards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Weight & Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
              <Weight className="w-3.5 h-3.5 text-brand" /> Trọng lượng (kg) <span className="text-brand">*</span>
            </label>
            <input
              type="number"
              name="weightKg"
              required
              min="0.1"
              step="0.1"
              value={formData.weightKg}
              onChange={handleInputChange}
              placeholder="VD: 50"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-brand" /> Kích thước (cm)
            </label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleInputChange}
              placeholder="VD: 120x80x100 cm"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-brand" /> Ghi chú
          </label>
          <textarea
            name="note"
            rows={2}
            value={formData.note}
            onChange={handleInputChange}
            placeholder="Mô tả hàng hóa, ghi chú giao nhận..."
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm resize-none focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* Price display breakdown 
        {priceResult && (
          <div className="rounded-xl border border-brand/20 bg-brand-soft/30 p-4 space-y-2 animate-fade-up">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand uppercase tracking-wider">Chi tiết phí vận chuyển</span>
              <span className="text-xs text-muted-foreground">{priceResult.routeType}</span>
            </div>
            
            <div className="text-sm space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Cước cơ bản (lên đến {priceResult.baseWeight}kg):</span>
                <span className="font-medium text-foreground">{priceResult.basePrice.toLocaleString('vi-VN')} VND</span>
              </div>
              
              {priceResult.extraWeight > 0 && (
                <div className="flex justify-between">
                  <span>Phụ trội ({priceResult.extraWeight.toFixed(1)}kg cộng thêm):</span>
                  <span className="font-medium text-foreground">+{priceResult.extraCharge.toLocaleString('vi-VN')} VND</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Tổng chi phí dự kiến:</span>
              <span className="text-lg font-extrabold text-brand font-display">
                {priceResult.total.toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>
        )}*/}

        {/* Dynamic Interactive controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Price Calculation Trigger Button */}
          <button
            type="button"
            onClick={runPriceCalculation}
            disabled={isCalculating || isSubmitting}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-brand text-brand text-sm font-semibold hover:bg-brand-soft/20 disabled:opacity-50 transition-colors"
          >
            {isCalculating ? (
              <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            Tính phí vận chuyển
          </button>

          {/* Direct Booking Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isCalculating || !priceResult}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              !priceResult
                ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border opacity-70'
                : 'bg-gradient-brand text-white hover:opacity-95'
            }`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {!priceResult ? 'Hãy tính phí trước' : 'Tạo đơn ngay'}
          </button>
        </div>
      </form>
    </div>
  )
}
