import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': 'admin_token=; Max-Age=0; Path=/; SameSite=Strict'
      }
    }
  )
}
