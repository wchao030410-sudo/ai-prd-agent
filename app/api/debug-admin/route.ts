import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasAdminHash: !!process.env.ADMIN_PASSWORD_HASH,
    hashLength: process.env.ADMIN_PASSWORD_HASH?.length || 0,
    hasJwtSecret: !!process.env.ADMIN_JWT_SECRET,
    jwtLength: process.env.ADMIN_JWT_SECRET?.length || 0,
  })
}
