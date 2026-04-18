import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip Supabase if credentials are not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseKey.includes('placeholder')
  ) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes
    const protectedPaths = ['/dashboard']
    const isProtectedPath = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )

    if (isProtectedPath && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dang-nhap'
      return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from auth pages
    const authPaths = ['/dang-nhap', '/dang-ky']
    const isAuthPath = authPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )

    if (isAuthPath && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const url = request.nextUrl.clone()
      if (profile?.role === 'employee') {
        url.pathname = '/dashboard/nhan-vien'
      } else {
        url.pathname = '/dashboard/khach-hang'
      }
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('Supabase middleware error:', error)
  }

  return supabaseResponse
}
