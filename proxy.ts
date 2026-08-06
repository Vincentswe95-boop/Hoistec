// proxy.ts
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('hoistec_session')
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  // If not logged in and trying to access protected routes -> send to login
  if (!sessionCookie && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in and trying to view the login page -> send to dashboard
  if (sessionCookie && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-current-path', request.nextUrl.pathname)
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
