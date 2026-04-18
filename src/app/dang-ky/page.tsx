'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Truck,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Building2,
  ArrowLeft,
  Check,
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const passwordChecks = [
    { label: 'Ít nhất 8 ký tự', valid: formData.password.length >= 8 },
    { label: 'Chứa chữ hoa', valid: /[A-Z]/.test(formData.password) },
    { label: 'Chứa số', valid: /\d/.test(formData.password) },
    {
      label: 'Mật khẩu khớp',
      valid:
        formData.confirmPassword.length > 0 &&
        formData.password === formData.confirmPassword,
    },
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    if (!agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản sử dụng.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          company: formData.company,
          password: formData.password,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        console.error('Registration API error:', payload)
        setError(payload?.error || 'Lỗi đăng ký tài khoản. Vui lòng thử lại.')
        return
      }

      // Redirect to login after successful registration
      router.push('/dang-nhap?registered=true')
    } catch (err) {
      console.error('Unexpected registration error:', err)
      const errorMsg =
        err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 dotted-bg opacity-30" />

      <div className="relative w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-brand px-8 py-8 text-center relative">
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-gold rounded border-2 border-dashed border-yellow-400/50 flex items-center justify-center transform rotate-6">
              <UserPlus className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="w-14 h-14 mx-auto bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Truck className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-white font-(family-name:--font-display)">
              Đăng ký tài khoản
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Tạo tài khoản khách hàng VietExpress
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                    <User className="w-3.5 h-3.5 text-brand" />
                    Họ và tên <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                  />
                </div>
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
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                    <Mail className="w-3.5 h-3.5 text-brand" />
                  Email <span className="text-brand">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                  <Building2 className="w-3.5 h-3.5 text-brand" />
                  Công ty
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Tên công ty (không bắt buộc)"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                    <Lock className="w-3.5 h-3.5 text-brand" />
                    Mật khẩu <span className="text-brand">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                    <Lock className="w-3.5 h-3.5 text-brand" />
                    Xác nhận <span className="text-brand">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Password strength indicators */}
              {formData.password.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center gap-1.5 text-xs ${
                        check.valid ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          check.valid
                            ? 'bg-green-100 border-green-300'
                            : 'border-border'
                        }`}
                      >
                        {check.valid && <Check className="w-2 h-2" />}
                      </div>
                      {check.label}
                    </div>
                  ))}
                </div>
              )}

              {/* Terms */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-border accent-brand"
                />
                <span className="text-xs text-muted-foreground">
                  Tôi đồng ý với{' '}
                  <Link href="#" className="text-brand hover:underline">
                    Điều khoản sử dụng
                  </Link>{' '}
                  và{' '}
                  <Link href="#" className="text-brand hover:underline">
                    Chính sách bảo mật
                  </Link>{' '}
                  của VietExpress.
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-gradient-brand rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Tạo tài khoản
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Đã có tài khoản?{' '}
                <Link
                  href="/dang-nhap"
                  className="text-brand font-semibold hover:underline"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
