import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'change-this-secret'
)

export async function middleware(request: NextRequest) {
  // Only protect admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Check for admin token
  const token = request.cookies.get('admin_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  try {
    await jwtVerify(token, ADMIN_SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*']
}
