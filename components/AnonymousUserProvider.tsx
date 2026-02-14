'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { getAnonymousUserId, generateSessionId } from '@/lib/anonymous-user'

interface AnonymousUserContextType {
  anonymousId: string
  sessionId: string
}

const AnonymousUserContext = createContext<AnonymousUserContextType | undefined>(undefined)

export function AnonymousUserProvider({ children }: { children: ReactNode }) {
  const anonymousId = getAnonymousUserId()
  const sessionId = typeof window !== 'undefined'
    ? sessionStorage.getItem('session_id') || generateSessionId()
    : ''

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', sessionId)
    }
  }, [sessionId])

  return (
    <AnonymousUserContext.Provider value={{ anonymousId, sessionId }}>
      {children}
    </AnonymousUserContext.Provider>
  )
}

export function useAnonymousUser() {
  const context = useContext(AnonymousUserContext)
  if (!context) {
    throw new Error('useAnonymousUser must be used within AnonymousUserProvider')
  }
  return context
}
