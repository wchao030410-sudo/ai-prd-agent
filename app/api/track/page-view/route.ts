import { trackPageView } from '@/lib/analytics'
import { NextResponse } from 'next/server'
import { getAnonymousIdFromCookie } from '@/lib/anonymous-user'

export async function POST(request: Request) {
  const body = await request.json()
  const anonymousId = body.anonymousId || getAnonymousIdFromCookie(request)
  const sessionId = body.sessionId
  const path = body.path || '/'

  await trackPageView(anonymousId, sessionId, path)

  return NextResponse.json({ success: true })
}
