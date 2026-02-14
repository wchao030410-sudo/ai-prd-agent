import { NextResponse } from 'next/server'
import { verifyAdminPassword } from '@/lib/admin-auth'

export async function POST(request: Request) {
  const body = await request.json()
  const password = body.password

  console.log('=== TEST: Password Verification Request ===')
  console.log('Password:', password)

  const result = await verifyAdminPassword(password)

  console.log('Verification Result:', result)

  if (result) {
    return NextResponse.json({
      success: true,
      message: 'Password is correct',
      hashUsed: process.env.ADMIN_PASSWORD_HASH?.substring(0, 20) + '...'
    })
  } else {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }
}
