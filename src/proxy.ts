import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const sessionCookie =
    request.cookies.get('__Secure-next-auth.session-token')?.value ??
    request.cookies.get('next-auth.session-token')?.value

  const token = sessionCookie
    ? await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      })
    : null

  const { pathname } = request.nextUrl
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isEmployeeDashboardRoute = pathname.startsWith('/dashboard/nhan-vien')
  const isCustomerDashboardRoute = pathname.startsWith('/dashboard/khach-hang')
  const isAuthRoute = pathname.startsWith('/dang-nhap') || pathname.startsWith('/dang-ky')

  if (isDashboardRoute && !sessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/dang-nhap'
    return NextResponse.redirect(url)
  }

  if (token && isEmployeeDashboardRoute && token.role !== 'employee') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/khach-hang'
    return NextResponse.redirect(url)
  }

  if (token && isCustomerDashboardRoute && token.role === 'employee') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/nhan-vien'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && token) {
    const url = request.nextUrl.clone()
    url.pathname = token.role === 'employee' ? '/dashboard/nhan-vien' : '/dashboard/khach-hang'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dang-nhap',
    '/dang-ky',
  ],
}