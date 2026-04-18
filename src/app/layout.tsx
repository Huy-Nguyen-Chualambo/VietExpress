import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers'

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VietExpress Logistics — Vận tải nội địa nhanh chóng, an toàn',
  description:
    'VietExpress cung cấp giải pháp vận tải nội địa toàn diện cho doanh nghiệp vừa và nhỏ tại Việt Nam. FTL, LTL, 3PL, chuyển phát nhanh, vận tải lạnh.',
  keywords: [
    'logistics',
    'vận tải',
    'nội địa',
    'Việt Nam',
    'FTL',
    'LTL',
    '3PL',
    'chuyển phát nhanh',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
