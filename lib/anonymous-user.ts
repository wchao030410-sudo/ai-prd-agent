/**
 * Generate or retrieve anonymous user ID
 * Uses localStorage for persistence across sessions
 */
export function getAnonymousUserId(): string {
  if (typeof window === 'undefined') return 'unknown'

  let userId = localStorage.getItem('anonymous_user_id')

  if (!userId) {
    // Generate unique ID: timestamp + random string
    userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('anonymous_user_id', userId)

    // Also set cookie for server-side access
    document.cookie = `anonymous_id=${userId}; max-age=31536000; path=/; SameSite=Lax`
  }

  return userId
}

/**
 * Get anonymous ID from cookie (server-side)
 */
export function getAnonymousIdFromCookie(request: Request): string {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  return cookies.anonymous_id || 'unknown'
}

/**
 * Generate session ID for tracking individual visits
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
