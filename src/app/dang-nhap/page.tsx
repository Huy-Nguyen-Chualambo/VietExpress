'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Truck,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Users,
  Briefcase,
  ArrowLeft,
} from 'lucide-react'
import { signIn, getSession } from 'next-auth/react'

type UserType = 'customer' | 'employee' | null

export default function LoginPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<UserType>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng.')
        return
      }

      const session = await getSession()
      const role = session?.user?.role ?? 'customer'

      if (userType === 'employee' && role !== 'employee') {
        setError('Tài khoản này không phải tài khoản nhân viên.')
        return
      }

      if (userType === 'customer' && role !== 'customer') {
        setError('Tài khoản này không phải tài khoản khách hàng.')
        return
      }

      // Redirect based on role
      if (role === 'employee') {
        router.push('/dashboard/nhan-vien')
      } else {
        router.push('/dashboard/khach-hang')
      }
    } catch (err) {
      console.error('Unexpected login error:', err)
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

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-brand px-8 py-8 text-center relative">
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-gold rounded border-2 border-dashed border-yellow-400/50 flex items-center justify-center transform rotate-6">
              <LogIn className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="w-14 h-14 mx-auto bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Truck className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-white font-display">
              Đăng nhập
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Chào mừng bạn quay trở lại VietExpress
            </p>
          </div>

          <div className="p-8">
            {/* User Type Selection */}
            {!userType ? (
              <div className="space-y-4 animate-fade-up">
                <p className="text-sm text-center text-muted-foreground mb-6">
                  Bạn đăng nhập với tư cách:
                </p>

                <button
                  onClick={() => setUserType('customer')}
                  className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-brand hover:bg-brand-soft transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-brand-soft rounded-lg flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                    <Users className="w-6 h-6 text-brand" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground font-display">
                      Khách hàng
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Theo dõi đơn hàng, yêu cầu báo giá
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setUserType('employee')}
                  className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-gold hover:bg-gold-soft transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gold-soft rounded-lg flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                    <Briefcase className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground font-display">
                      Nhân viên
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Quản lý vận đơn, khách hàng, tuyến đường
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              /* Login Form */
              <div className="space-y-5 animate-fade-up">
                {/* Selected Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                      userType === 'customer'
                        ? 'bg-brand-soft text-brand'
                        : 'bg-gold-soft text-amber-700'
                    }`}
                  >
                    {userType === 'customer' ? (
                      <Users className="w-3 h-3" />
                    ) : (
                      <Briefcase className="w-3 h-3" />
                    )}
                    {userType === 'customer' ? 'Khách hàng' : 'Nhân viên'}
                  </div>
                  <button
                    onClick={() => {
                      setUserType(null)
                      setError('')
                    }}
                    className="text-xs text-muted-foreground hover:text-brand transition-colors"
                  >
                    Đổi loại tài khoản
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                      <Mail className="w-3.5 h-3.5 text-brand" />
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@company.com"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                      <Lock className="w-3.5 h-3.5 text-brand" />
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border accent-brand"
                      />
                      <span className="text-muted-foreground">Ghi nhớ đăng nhập</span>
                    </label>
                    <Link
                      href="#"
                      className="text-brand hover:underline font-medium"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-gradient-brand rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Đăng nhập
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Register Link */}
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Chưa có tài khoản?{' '}
                <Link
                  href="/dang-ky"
                  className="text-brand font-semibold hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

