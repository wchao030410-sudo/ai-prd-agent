import { NextResponse } from 'next/server'
import { verifyAdminPassword } from '@/lib/admin-auth'
import { SignJWT } from 'jose'

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'change-this-secret'
)

export async function POST(request: Request) {
  const body = await request.json()
  const password = body.password

  const isValid = await verifyAdminPassword(password)

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }

  // Generate admin token (valid for 24 hours)
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(ADMIN_SECRET)

  return NextResponse.json({
    success: true,
    token
  })
}
