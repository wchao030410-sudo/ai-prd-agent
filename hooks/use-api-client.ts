'use client'

import { useAnonymousUser } from '@/components/AnonymousUserProvider'

export function useApiClient() {
  const { anonymousId, sessionId } = useAnonymousUser()

  async function apiCall(url: string, options?: RequestInit) {
    const body = options?.body ? JSON.parse(options.body as string) : {}

    // Automatically add anonymous tracking
    const enrichedBody = {
      ...body,
      anonymousId,
      sessionId
    }

    return fetch(url, {
      ...options,
      body: JSON.stringify(enrichedBody)
    })
  }

  return { apiCall, anonymousId, sessionId }
}
