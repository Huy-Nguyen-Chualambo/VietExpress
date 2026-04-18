import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCustomerSettings, formatDateTime } from '@/lib/customer-portal'
import {
  Building2,
  CalendarCheck2,
  Globe,
  Mail,
  Phone,
  Save,
  Settings,
  User,
} from 'lucide-react'

const settingsSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ tên.'),
  phone: z.string().optional(),
  company: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  language: z.string().min(1),
  theme: z.string().min(1),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
})

async function saveSettings(formData: FormData) {
  'use server'

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const input = settingsSchema.parse({
    fullName: String(formData.get('fullName') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    company: String(formData.get('company') ?? '').trim(),
    companyName: String(formData.get('companyName') ?? '').trim(),
    address: String(formData.get('address') ?? '').trim(),
    language: String(formData.get('language') ?? 'vi').trim(),
    theme: String(formData.get('theme') ?? 'light').trim(),
    emailNotifications: formData.get('emailNotifications') === 'on',
    smsNotifications: formData.get('smsNotifications') === 'on',
    pushNotifications: formData.get('pushNotifications') === 'on',
  })

  await prisma.$transaction([
    prisma.profile.upsert({
      where: { id: session.user.id },
      update: {
        fullName: input.fullName,
        phone: input.phone || null,
        company: input.company || null,
      },
      create: {
        id: session.user.id,
        fullName: input.fullName,
        phone: input.phone || null,
        company: input.company || null,
        email: session.user.email || '',
        role: 'customer',
      },
    }),
    prisma.customerSetting.upsert({
      where: { userId: session.user.id },
      update: {
        language: input.language,
        theme: input.theme,
        emailNotifications: input.emailNotifications,
        smsNotifications: input.smsNotifications,
        pushNotifications: input.pushNotifications,
        companyName: input.companyName || null,
        phone: input.phone || null,
        address: input.address || null,
      },
      create: {
        userId: session.user.id,
        language: input.language,
        theme: input.theme,
        emailNotifications: input.emailNotifications,
        smsNotifications: input.smsNotifications,
        pushNotifications: input.pushNotifications,
        companyName: input.companyName || null,
        phone: input.phone || null,
        address: input.address || null,
      },
    }),
  ])

  revalidatePath('/dashboard/khach-hang/cai-dat')
  revalidatePath('/dashboard/khach-hang')
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/dang-nhap')
  }

  const { profile, settings } = await getCustomerSettings(session.user.id)
  const email = profile?.user.email || session.user.email || ''
  const fullName = profile?.fullName || session.user.name || ''
  const phone = profile?.phone || settings?.phone || ''
  const company = profile?.company || settings?.companyName || ''
  const address = settings?.address || ''
  const language = settings?.language || 'vi'
  const theme = settings?.theme || 'light'

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl border border-border/50 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Cài đặt
            </p>
            <h1 className="text-2xl font-bold font-display">
              Hồ sơ và tùy chọn cá nhân
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Cập nhật thông tin hồ sơ thật của tài khoản khách hàng và cấu hình nhận
              thông báo theo nhu cầu.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarCheck2 className="w-4 h-4 text-brand" />
            Cập nhật lần cuối: {formatDateTime(settings?.updatedAt)}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center">
                <User className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-base font-semibold font-display">
                  Thông tin tài khoản
                </h2>
                <p className="text-sm text-muted-foreground">
                  Dữ liệu này đang được liên kết với NextAuth.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-muted/30 p-4 flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand" />
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-medium">{email}</div>
                </div>
              </div>
              <div className="rounded-xl bg-muted/30 p-4 flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand" />
                <div>
                  <div className="text-xs text-muted-foreground">Số điện thoại</div>
                  <div className="font-medium">{phone || 'Chưa cập nhật'}</div>
                </div>
              </div>
              <div className="rounded-xl bg-muted/30 p-4 flex items-center gap-3">
                <Building2 className="w-4 h-4 text-brand" />
                <div>
                  <div className="text-xs text-muted-foreground">Công ty</div>
                  <div className="font-medium">{company || 'Chưa cập nhật'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand" />
              <h3 className="font-semibold font-display">Cài đặt hiện tại</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground mb-1">Ngôn ngữ</div>
                <div className="font-medium">{language.toUpperCase()}</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground mb-1">Giao diện</div>
                <div className="font-medium capitalize">{theme}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold font-display">
              Chỉnh sửa thông tin
            </h2>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>

          <form action={saveSettings} className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Họ và tên</label>
                <input
                  name="fullName"
                  defaultValue={fullName}
                  required
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Số điện thoại</label>
                <input
                  name="phone"
                  defaultValue={phone}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Công ty</label>
                <input
                  name="company"
                  defaultValue={company}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tên công ty hiển thị</label>
                <input
                  name="companyName"
                  defaultValue={settings?.companyName || company}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Địa chỉ</label>
              <input
                name="address"
                defaultValue={address}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ngôn ngữ</label>
                <select
                  name="language"
                  defaultValue={language}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Giao diện</label>
                <select
                  name="theme"
                  defaultValue={theme}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <option value="light">Sáng</option>
                  <option value="dark">Tối</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  defaultChecked={settings?.emailNotifications ?? true}
                  className="mt-1 h-4 w-4 rounded border-border accent-brand"
                />
                <span>
                  <span className="block text-sm font-medium">Thông báo email</span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    Nhận cập nhật qua email
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
                <input
                  type="checkbox"
                  name="smsNotifications"
                  defaultChecked={settings?.smsNotifications ?? false}
                  className="mt-1 h-4 w-4 rounded border-border accent-brand"
                />
                <span>
                  <span className="block text-sm font-medium">Thông báo SMS</span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    Nhận tin nhắn theo đơn hàng
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">
                <input
                  type="checkbox"
                  name="pushNotifications"
                  defaultChecked={settings?.pushNotifications ?? true}
                  className="mt-1 h-4 w-4 rounded border-border accent-brand"
                />
                <span>
                  <span className="block text-sm font-medium">Thông báo đẩy</span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    Nhận thông báo trong ứng dụng
                  </span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:opacity-95 transition-opacity"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </form>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-border/50 p-5">
        <h3 className="font-semibold font-display mb-2">
          Ghi chú dữ liệu thật
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Những thay đổi bạn lưu ở đây sẽ cập nhật ngay vào bảng <code>profiles</code> và
          <code>customer_settings</code>. Nếu hồ sơ chưa có dữ liệu, hệ thống sẽ tạo mới
          theo tài khoản hiện tại.
        </p>
      </section>
    </div>
  )
}
