# Analytics Without Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add user analytics and admin dashboard without requiring user authentication, using anonymous ID tracking.

**Architecture:**
- Anonymous ID system (localStorage + cookie) for user identification
- Vercel Analytics for basic traffic metrics
- Custom event tracking for PRD generation statistics
- Simple password-protected admin dashboard

**Tech Stack:**
- Vercel Analytics, Prisma 5.22, Next.js 16.1 (App Router)
- shadcn/ui, Recharts, bcrypt for password hashing

---

## Table of Contents

1. [Phase 1: Anonymous ID System](#phase-1-anonymous-id-system)
2. [Phase 2: Database Updates](#phase-2-database-updates)
3. [Phase 3: Event Tracking](#phase-3-event-tracking)
4. [Phase 4: Admin Dashboard](#phase-4-admin-dashboard)
5. [Phase 5: Vercel Analytics](#phase-5-vercel-analytics)
6. [Phase 6: Optional - PostHog](#phase-6-optional---posthog)

---

## Phase 1: Anonymous ID System

### Task 1: Create Anonymous ID Utility

**Files:**
- Create: `lib/anonymous-user.ts`

**Step 1: Create anonymous ID utility**

```typescript
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
```

**Step 2: Create client context provider**

**Files:**
- Create: `components/AnonymousUserProvider.tsx`

```typescript
'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { getAnonymousUserId } from '@/lib/anonymous-user'

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
```

**Step 3: Update root layout to include provider**

**Files:**
- Modify: `app/layout.tsx`

First, read the current layout:

```bash
cat app/layout.tsx
```

Then add the provider (example structure):

```typescript
import { AnonymousUserProvider } from '@/components/AnonymousUserProvider'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AnonymousUserProvider>
          {children}
        </AnonymousUserProvider>
      </body>
    </html>
  )
}
```

**Step 4: Commit**

```bash
git add lib/anonymous-user.ts components/AnonymousUserProvider.tsx app/layout.tsx
git commit -m "feat: add anonymous user ID system"
```

---

### Task 2: Create Client Hook for API Calls

**Files:**
- Create: `hooks/use-api-client.ts`

**Step 1: Create API client hook**

```typescript
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
```

**Step 2: Commit**

```bash
git add hooks/use-api-client.ts
git commit -m "feat: add API client hook with anonymous tracking"
```

---

## Phase 2: Database Updates

### Task 3: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add tracking fields to Session model**

```prisma
model Session {
  id           String   @id @default(cuid())
  title        String
  prdId        String?  @unique
  currentStep  Int      @default(1)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // NEW: Anonymous tracking fields
  anonymousId  String   @default("unknown")
  sessionId    String?   @unique

  messages     Message[]
  prd           PRD?

  @@index([anonymousId])
  @@index([sessionId])
}
```

**Step 2: Add AnalyticsEvent model**

```prisma
// NEW: Track all analytics events
model AnalyticsEvent {
  id          String   @id @default(cuid())
  eventType   String   // prd_generated, prd_failed, page_view, etc.
  anonymousId String
  sessionId   String?

  // Event metadata (JSON)
  metadata    Json?

  // Performance metrics
  duration    Int?     // for timing events

  createdAt   DateTime @default(now())

  @@index([eventType])
  @@index([anonymousId])
  @@index([createdAt])
}
```

**Step 3: Add DailyStats model**

```prisma
// NEW: Aggregated daily statistics
model DailyStats {
  id          String   @id @default(cuid())
  date        DateTime @db.Date

  // User metrics (anonymous)
  uniqueUsers Int      @default(0)
  totalVisits Int      @default(0)

  // PRD metrics
  prdGenerated Int     @default(0)
  prdSuccess   Float   @default(0)  // success rate
  avgDuration  Float?  // average generation time in seconds

  // System metrics
  totalTokens  Int     @default(0)
  errorCount   Int     @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([date])
  @@index([date])
}
```

**Step 4: Generate and push schema**

Run: `npx prisma generate`

Run: `npx prisma db push`

**Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add analytics models to schema"
```

---

## Phase 3: Event Tracking

### Task 4: Create Analytics Service

**Files:**
- Create: `lib/analytics.ts`

**Step 1: Create analytics tracking service**

```typescript
import { prisma } from '@/lib/prisma'

interface TrackEventParams {
  eventType: string
  anonymousId: string
  sessionId?: string
  metadata?: Record<string, any>
  duration?: number
}

export async function trackEvent(params: TrackEventParams) {
  return await prisma.analyticsEvent.create({
    data: params
  })
}

export async function trackPRDGeneration(params: {
  anonymousId: string
  sessionId?: string
  title: string
  status: 'success' | 'failed'
  duration: number
  tokensUsed?: number
  error?: string
}) {
  // Track event
  await trackEvent({
    eventType: params.status === 'success' ? 'prd_generated' : 'prd_failed',
    anonymousId: params.anonymousId,
    sessionId: params.sessionId,
    duration: params.duration,
    metadata: {
      title: params.title,
      tokensUsed: params.tokensUsed,
      error: params.error
    }
  })

  // Update daily stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.dailyStats.findUnique({
    where: { date: today }
  })

  const newGenerated = (existing?.prdGenerated || 0) + 1

  if (params.status === 'success') {
    const currentSuccessRate = existing?.prdSuccess || 0
    const successCount = Math.round((newGenerated - 1) * (currentSuccessRate / 100))
    const newSuccessRate = ((successCount + 1) / newGenerated) * 100

    await prisma.dailyStats.upsert({
      where: { date: today },
      create: {
        date: today,
        prdGenerated: 1,
        prdSuccess: 100,
        totalTokens: params.tokensUsed || 0,
        avgDuration: params.duration
      },
      update: {
        prdGenerated: newGenerated,
        prdSuccess: newSuccessRate,
        totalTokens: { increment: params.tokensUsed || 0 },
        avgDuration: params.duration,
        updatedAt: new Date()
      }
    })
  } else {
    const currentSuccessRate = existing?.prdSuccess || 100
    const successCount = Math.round((newGenerated - 1) * (currentSuccessRate / 100))
    const newSuccessRate = (successCount / newGenerated) * 100

    await prisma.dailyStats.upsert({
      where: { date: today },
      create: {
        date: today,
        prdGenerated: 1,
        prdSuccess: 0,
        errorCount: 1
      },
      update: {
        prdGenerated: newGenerated,
        prdSuccess: newSuccessRate,
        errorCount: { increment: 1 }
      }
    })
  }
}

export async function trackPageView(anonymousId: string, sessionId: string, path: string) {
  await trackEvent({
    eventType: 'page_view',
    anonymousId,
    sessionId,
    metadata: { path }
  })

  // Update daily visit count
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.dailyStats.upsert({
    where: { date: today },
    create: { date: today, totalVisits: 1 },
    update: { totalVisits: { increment: 1 } }
  })
}
```

**Step 2: Commit**

```bash
git add lib/analytics.ts
git commit -m "feat: add analytics tracking service"
```

---

### Task 5: Integrate Tracking into PRD Generate API

**Files:**
- Modify: `app/api/prd/generate/route.ts`

**Step 1: Read existing API route**

Run: `cat app/api/prd/generate/route.ts`

**Step 2: Add tracking to generate endpoint**

Add timing and tracking around existing logic:

```typescript
import { trackPRDGeneration } from '@/lib/analytics'
import { getAnonymousIdFromCookie } from '@/lib/anonymous-user'

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const anonymousId = body.anonymousId || getAnonymousIdFromCookie(request)
    const sessionId = body.sessionId || 'unknown'

    // ... existing PRD generation logic ...

    const duration = Math.round((Date.now() - startTime) / 1000)

    // Track successful generation
    await trackPRDGeneration({
      anonymousId,
      sessionId,
      title: body.title || 'Generated PRD',
      status: 'success',
      duration,
      tokensUsed: response.usage?.total_tokens
    })

    return NextResponse.json({ ...existingResponse })

  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000)
    const body = await request.json().catch(() => ({}))
    const anonymousId = body.anonymousId || getAnonymousIdFromCookie(request)
    const sessionId = body.sessionId || 'unknown'

    // Track failed generation
    await trackPRDGeneration({
      anonymousId,
      sessionId,
      title: body.title || 'Failed PRD',
      status: 'failed',
      duration,
      error: error.message
    })

    throw error
  }
}
```

**Step 3: Commit**

```bash
git add app/api/prd/generate/route.ts
git commit -m "feat: add analytics tracking to PRD generation"
```

---

### Task 6: Create Page View Tracking Middleware

**Files:**
- Create: `app/api/track/page-view/route.ts`

**Step 1: Create page view tracking endpoint**

```typescript
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
```

**Step 2: Create page view hook**

**Files:**
- Create: `hooks/use-page-view-tracking.ts`

```typescript
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
    }).catch(console.error) // Non-blocking
  }, [pathname, anonymousId, sessionId])
}
```

**Step 3: Add tracking to root layout**

**Files:**
- Modify: `app/layout.tsx`

```typescript
import { AnonymousUserProvider } from '@/components/AnonymousUserProvider'
import { PageViewTracker } from '@/components/PageViewTracker'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AnonymousUserProvider>
          <PageViewTracker />
          {children}
        </AnonymousUserProvider>
      </body>
    </html>
  )
}
```

**Step 4: Create PageViewTracker component**

**Files:**
- Create: `components/PageViewTracker.tsx`

```typescript
'use client'

import { usePageViewTracking } from '@/hooks/use-page-view-tracking'

export function PageViewTracker() {
  usePageViewTracking()
  return null
}
```

**Step 5: Commit**

```bash
git add app/api/track lib/hooks components app/layout.tsx
git commit -m "feat: add page view tracking"
```

---

## Phase 4: Admin Dashboard

### Task 7: Create Simple Auth Middleware

**Files:**
- Create: `lib/admin-auth.ts`

**Step 1: Create password verification**

```typescript
import { compare } from 'bcrypt'

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) {
    console.warn('ADMIN_PASSWORD_HASH not set')
    return false
  }

  return await compare(password, ADMIN_PASSWORD_HASH)
}

// Generate hash for environment variable
// Run this in Node.js: console.log(require('bcrypt').hashSync('your-password', 10))
```

**Step 2: Update .env.example**

**Files:**
- Modify: `.env.example`

Add:
```env
# Admin Dashboard Password (generate hash with: node -e "console.log(require('bcrypt').hashSync('your-password', 10))")
ADMIN_PASSWORD_HASH=your_bcrypt_hash_here
```

**Step 3: Install bcrypt**

Run: `npm install bcrypt @types/bcrypt`

**Step 4: Commit**

```bash
git add package.json lib/admin-auth.ts .env.example
git commit -m "feat: add admin password verification"
```

---

### Task 8: Create Admin Login API

**Files:**
- Create: `app/api/admin/login/route.ts`

**Step 1: Create login endpoint**

```typescript
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
```

**Step 2: Install jose for JWT**

Run: `npm install jose`

**Step 3: Update .env.example**

Add:
```env
ADMIN_JWT_SECRET=generate_random_secret_at_least_32_chars
```

**Step 4: Commit**

```bash
git add app/api/admin/login/route.ts package.json .env.example
git commit -m "feat: add admin login API"
```

---

### Task 9: Create Admin Middleware

**Files:**
- Create: `middleware.ts`

**Step 1: Create middleware for admin protection**

```typescript
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
```

**Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add admin middleware"
```

---

### Task 10: Create Admin Login Page

**Files:**
- Create: `app/admin/login/page.tsx`

**Step 1: Create login page**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Set token as cookie
      document.cookie = `admin_token=${data.token}; max-age=86400; path=/; SameSite=Strict`

      router.push('/admin')
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin password"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/admin/login/page.tsx
git commit -m "feat: add admin login page"
```

---

### Task 11: Create Admin Dashboard Layout

**Files:**
- Create: `app/admin/layout.tsx`

**Step 1: Create admin layout**

```typescript
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-semibold">Analytics Dashboard</h1>
              <nav className="flex gap-4">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                  Overview
                </Link>
                <Link href="/admin/prd-logs" className="text-gray-600 hover:text-gray-900">
                  PRD Logs
                </Link>
                <Link href="/admin/users" className="text-gray-600 hover:text-gray-900">
                  Users
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm text-gray-600">Back to App</a>
              <form action="/api/admin/logout" method="POST">
                <button type="submit" className="text-sm text-red-600 hover:text-red-700">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
```

**Step 2: Create logout API**

**Files:**
- Create: `app/api/admin/logout/route.ts`

```typescript
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
```

**Step 3: Commit**

```bash
git add app/admin/layout.tsx app/api/admin/logout/route.ts
git commit -m "feat: add admin layout and logout"
```

---

### Task 12: Create Admin Overview Page

**Files:**
- Create: `app/admin/page.tsx`
- Create: `components/admin/StatsCard.tsx`

**Step 1: Create StatsCard component**

```typescript
interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  icon?: React.ReactNode
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          {change && (
            <p className="mt-2 text-sm text-green-600">{change}</p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create admin overview page**

```typescript
import { StatsCard } from '@/components/admin/StatsCard'
import { Users, FileText, Activity, AlertCircle } from 'lucide-react'

async function getAnalyticsStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/stats`, {
    cache: 'no-store'
  })

  if (!res.ok) {
    return { today: { uniqueUsers: 0, totalVisits: 0, prdGenerated: 0, errorCount: 0 } }
  }

  return await res.json()
}

export default async function AdminOverviewPage() {
  const stats = await getAnalyticsStats()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Today's Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Unique Users"
          value={stats.today?.uniqueUsers || 0}
          icon={<Users className="w-6 h-6" />}
        />
        <StatsCard
          title="Total Visits"
          value={stats.today?.totalVisits || 0}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatsCard
          title="PRDs Generated"
          value={stats.today?.prdGenerated || 0}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatsCard
          title="Errors"
          value={stats.today?.errorCount || 0}
          icon={<AlertCircle className="w-6 h-6" />}
        />
      </div>
    </div>
  )
}
```

**Step 3: Create stats API**

**Files:**
- Create: `app/api/admin/stats/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = await prisma.dailyStats.findUnique({
    where: { date: today }
  })

  return NextResponse.json({
    today: stats || {
      uniqueUsers: 0,
      totalVisits: 0,
      prdGenerated: 0,
      prdSuccess: 0,
      errorCount: 0
    }
  })
}
```

**Step 4: Commit**

```bash
git add app/admin/page.tsx components/admin/StatsCard.tsx app/api/admin/stats/route.ts
git commit -m "feat: add admin overview page"
```

---

### Task 13: Create PRD Logs Page

**Files:**
- Create: `app/admin/prd-logs/page.tsx`
- Create: `components/admin/PRDLogsTable.tsx`

**Step 1: Create PRDLogsTable component**

```typescript
interface PRDLog {
  id: string
  eventType: string
  duration: number | null
  createdAt: Date
  metadata: {
    title?: string
    tokensUsed?: number
    error?: string
  } | null
}

interface PRDLogsTableProps {
  logs: PRDLog[]
}

export function PRDLogsTable({ logs }: PRDLogsTableProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  log.eventType === 'prd_generated' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {log.eventType}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {log.metadata?.title || '-'}
                {log.metadata?.error && (
                  <p className="text-red-600 text-xs mt-1">{log.metadata.error}</p>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.duration ? `${log.duration}s` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.metadata?.tokensUsed || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 2: Create PRD logs page**

```typescript
import { PRDLogsTable } from '@/components/admin/PRDLogsTable'

async function getPRDLogs() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/prd-logs`, {
    cache: 'no-store'
  })

  if (!res.ok) return []

  const data = await res.json()
  return data.logs
}

export default async function PRDLogsPage() {
  const logs = await getPRDLogs()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">PRD Generation Logs</h2>
      <PRDLogsTable logs={logs} />
    </div>
  )
}
```

**Step 3: Create PRD logs API**

**Files:**
- Create: `app/api/admin/prd-logs/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const logs = await prisma.analyticsEvent.findMany({
    where: {
      eventType: {
        in: ['prd_generated', 'prd_failed']
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  return NextResponse.json({ logs })
}
```

**Step 4: Commit**

```bash
git add app/admin/prd-logs app/api/admin/prd-logs components/admin/PRDLogsTable.tsx
git commit -m "feat: add PRD logs page"
```

---

### Task 14: Create Anonymous Users Page

**Files:**
- Create: `app/admin/users/page.tsx`
- Create: `components/admin/AnonymousUsersTable.tsx`

**Step 1: Create AnonymousUsersTable component**

```typescript
interface UserStat {
  anonymousId: string
  eventCount: number
  lastActive: Date
  prdGenerated: number
}

interface AnonymousUsersTableProps {
  users: UserStat[]
}

export function AnonymousUsersTable({ users }: AnonymousUsersTableProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anonymous ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRDs Generated</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.anonymousId}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {user.anonymousId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.eventCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.prdGenerated}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.lastActive).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 2: Create users page**

```typescript
import { AnonymousUsersTable } from '@/components/admin/AnonymousUsersTable'

async function getUserStats() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/users`, {
    cache: 'no-store'
  })

  if (!res.ok) return []

  const data = await res.json()
  return data.users
}

export default async function UsersPage() {
  const users = await getUserStats()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Anonymous Users</h2>
      <AnonymousUsersTable users={users} />
    </div>
  )
}
```

**Step 3: Create user stats API**

**Files:**
- Create: `app/api/admin/users/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  // Aggregate user stats from analytics events
  const userStats = await prisma.analyticsEvent.groupBy({
    by: ['anonymousId'],
    _count: {
      id: true
    },
    _max: {
      createdAt: true
    },
    orderBy: {
      _max: {
        createdAt: 'desc'
      }
    },
    take: 100
  })

  // Get PRD count for each user
  const usersWithPRDCount = await Promise.all(
    userStats.map(async (user) => {
      const prdCount = await prisma.analyticsEvent.count({
        where: {
          anonymousId: user.anonymousId,
          eventType: 'prd_generated'
        }
      })

      return {
        anonymousId: user.anonymousId,
        eventCount: user._count.id,
        lastActive: user._max.createdAt!,
        prdGenerated: prdCount
      }
    })
  )

  return NextResponse.json({ users: usersWithPRDCount })
}
```

**Step 4: Commit**

```bash
git add app/admin/users app/api/admin/users components/admin/AnonymousUsersTable.tsx
git commit -m "feat: add anonymous users page"
```

---

## Phase 5: Vercel Analytics

### Task 15: Integrate Vercel Analytics

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Install Vercel Analytics**

Run: `npm install @vercel/analytics`

**Step 2: Add to root layout**

Update `app/layout.tsx`:

```typescript
import { AnonymousUserProvider } from '@/components/AnonymousUserProvider'
import { PageViewTracker } from '@/components/PageViewTracker'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AnonymousUserProvider>
          <PageViewTracker />
          {children}
        </AnonymousUserProvider>
        <Analytics />
      </body>
    </html>
  )
}
```

**Step 3: Commit**

```bash
git add package.json app/layout.tsx
git commit -m "feat: add Vercel Analytics"
```

---

## Phase 6: Optional - PostHog

### Task 16: Integrate PostHog (Optional)

**Files:**
- Create: `lib/posthog.ts`
- Create: `components/PostHogProvider.tsx`
- Modify: `app/layout.tsx`

**Step 1: Install PostHog**

Run: `npm install posthog-js`

**Step 2: Create PostHog client**

```typescript
'use client'

import PostHog from 'posthog-js'

let posthogClient: PostHog | null = null

export function initPostHog() {
  if (typeof window === 'undefined' || posthogClient) return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) {
    console.warn('NEXT_PUBLIC_POSTHOG_KEY not set')
    return
  }

  posthogClient = posthogjs.init(key, {
    api_host: 'https://app.posthog.com',
    loaded: (ph) => {
      posthogClient = ph
    }
  })
}

export function getPostHog() {
  return posthogClient
}
```

**Step 3: Create PostHog provider**

```typescript
'use client'

import { useEffect } from 'react'
import { initPostHog } from '@/lib/posthog'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  return <>{children}</>
}
```

**Step 4: Add to layout**

Update `app/layout.tsx`:

```typescript
import { PostHogProvider } from '@/components/PostHogProvider'
import { AnonymousUserProvider } from '@/components/AnonymousUserProvider'
import { PageViewTracker } from '@/components/PageViewTracker'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <PostHogProvider>
          <AnonymousUserProvider>
            <PageViewTracker />
            {children}
          </AnonymousUserProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  )
}
```

**Step 5: Update .env.example**

Add:
```env
# Optional: PostHog Analytics (100万 events/month free)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
```

**Step 6: Commit**

```bash
git add lib/posthog.ts components/PostHogProvider.tsx app/layout.tsx .env.example
git commit -m "feat: add PostHog analytics (optional)"
```

---

## Final Tasks

### Task 17: Create Setup Documentation

**Files:**
- Create: `docs/ANALYTICS_SETUP.md`

**Step 1: Write setup guide**

```markdown
# Analytics Setup Guide

## Overview

This project uses anonymous tracking to monitor user behavior without requiring authentication.

## Features

- ✅ Anonymous user identification (localStorage + cookie)
- ✅ Page view tracking
- ✅ PRD generation tracking
- ✅ Admin dashboard with password protection
- ✅ Daily statistics aggregation

## Environment Variables

Add these to your `.env` file:

\`\`\`bash
# Admin Dashboard Password
# Generate hash with: node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
ADMIN_PASSWORD_HASH=$2a$10$your_hash_here

# Admin JWT Secret (generate random string at least 32 chars)
ADMIN_JWT_SECRET=your_random_secret_at_least_32_characters_long

# Optional: PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_key
\`\`\`

## Admin Dashboard

1. Go to `/admin/login`
2. Enter the password you set
3. View analytics, PRD logs, and user stats

## Generating Admin Password Hash

\`\`\`bash
node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
\`\`\`

Copy the output to `ADMIN_PASSWORD_HASH` in your `.env` file.

## Data Privacy

- No personal data is collected
- Anonymous IDs are stored locally on user devices
- Users can clear their anonymous ID by clearing browser data
- All data is aggregated for analytics purposes only

## Database

Tables added:
- `AnalyticsEvent` - Individual event tracking
- `DailyStats` - Aggregated daily statistics
- `Session` - Updated with anonymousId and sessionId

Run migration:
\`\`\`bash
npx prisma db push
\`\`\`
```

**Step 2: Commit**

```bash
git add docs/ANALYTICS_SETUP.md
git commit -m "docs: add analytics setup guide"
```

---

### Task 18: Create Testing Checklist

**Files:**
- Create: `docs/ANALYTICS_TESTING.md`

**Step 1: Write testing checklist**

```markdown
# Analytics Testing Checklist

## Anonymous ID System

- [ ] Anonymous ID is generated on first visit
- [ ] ID persists across page refreshes (localStorage)
- [ ] ID is included in API requests
- [ ] Server can read ID from cookies

## Event Tracking

- [ ] Page views are tracked
- [ ] PRD generation success is tracked
- [ ] PRD generation failures are tracked
- [ ] Duration is recorded for generations
- [ ] Token usage is recorded

## Admin Dashboard

- [ ] Login page loads
- [ ] Invalid password shows error
- [ ] Valid password redirects to /admin
- [ ] Overview page displays today's stats
- [ ] PRD logs page shows events
- [ ] Users page shows anonymous users
- [ ] Logout works

## Daily Stats

- [ ] Stats are aggregated correctly
- [ ] Success rate is calculated accurately
- [ ] Average duration is updated
- [ ] Token counts are accurate

## Third-Party Integrations

- [ ] Vercel Analytics receives page views (check Vercel dashboard)
- [ ] (Optional) PostHog captures events (check PostHog dashboard)

## Performance

- [ ] Tracking doesn't block UI
- [ ] Failed tracking doesn't break app
- [ ] Admin dashboard loads quickly
```

**Step 2: Commit**

```bash
git add docs/ANALYTICS_TESTING.md
git commit -m "docs: add analytics testing checklist"
```

---

## Summary

This plan implements:

✅ Anonymous user ID system (no login required)
✅ Page view and event tracking
✅ PRD generation analytics
✅ Password-protected admin dashboard
✅ Daily statistics aggregation
✅ Vercel Analytics integration
✅ Optional PostHog integration

**Estimated timeline:** 3-5 days
**Total commits:** ~18 commits

**Key Features:**
- Users don't need to register/login
- You still get valuable analytics data
- Simple password-protected admin panel
- Privacy-friendly (anonymous IDs only)

---

## Next Steps

After plan is saved, you have two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
