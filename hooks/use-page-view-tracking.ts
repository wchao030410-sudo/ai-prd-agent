'use client'

import { useEffect } from 'react'
import { useAnonymousUser } from '@/components/AnonymousUserProvider'
import { usePathname } from 'next/navigation'

export function usePageViewTracking() {
  const pathname = usePathname()
  const { anonymousId, sessionId } = useAnonymousUser()

  useEffect(() => {
    // Track page view
    fetch('/api/track/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymousId,
        sessionId,
        path: pathname
      })
    }).catch(() => {}) // Non-blocking
  }, [pathname, anonymousId, sessionId])
}
