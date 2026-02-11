# User Authentication and Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add user authentication (Logto), data analytics, and admin dashboard to track user behavior and system performance.

**Architecture:**
- Logto for authentication with WeChat OAuth support
- Hybrid analytics: Vercel Analytics + PostHog + custom event tracking
- Admin dashboard at `/admin` with role-based access control
- Prisma models: User, PRDLog, DailyStats, integrate with existing Session

**Tech Stack:**
- Logto (authentication), Prisma 5.22, Next.js 16.1 (App Router)
- Vercel Analytics, Sentry, shadcn/ui, Recharts

---

## Table of Contents

1. [Phase 1: User Authentication (Logto)](#phase-1-user-authentication-logto)
2. [Phase 2: Database Schema Updates](#phase-2-database-schema-updates)
3. [Phase 3: Data Analytics & Tracking](#phase-3-data-analytics--tracking)
4. [Phase 4: Admin Dashboard](#phase-4-admin-dashboard)
5. [Phase 5: Third-Party Integrations](#phase-5-third-party-integrations)

---

## Phase 1: User Authentication (Logto)

### Task 1: Install Logto Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Logto SDK**

Run: `npm install @logto/next`

**Step 2: Update .env.example**

**Files:**
- Modify: `.env.example`

Add Logto environment variables:
```env
# Logto Authentication
LOGTO_ENDPOINT=https://your-logto-app.logto.app
LOGTO_APP_ID=your_app_id
LOGTO_APP_SECRET=your_app_secret
LOGTO_REDIRECT_URI=http://localhost:3000/api/auth/callback/logto
```

**Step 3: Commit**

```bash
git add package.json .env.example
git commit -m "feat: add Logto dependencies and env config"
```

---

### Task 2: Create Logto Configuration

**Files:**
- Create: `lib/logto.ts`

**Step 1: Create Logto config file**

```typescript
import { LogtoNextConfig } from '@logto/next'

export const logtoConfig: LogtoNextConfig = {
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  baseUrl: process.env.LOGTO_BASE_URL || 'http://localhost:3000',
  cookieSecret: process.env.LOGTO_COOKIE_SECRET || 'generate_a_secure_secret',
  cookieSecure: process.env.NODE_ENV === 'production',
}
```

**Step 2: Update .env.example with cookie secret**

**Files:**
- Modify: `.env.example`

Add: `LOGTO_COOKIE_SECRET=your_random_secret_here`

**Step 3: Commit**

```bash
git add lib/logto.ts .env.example
git commit -m "feat: add Logto configuration"
```

---

### Task 3: Create Auth API Routes

**Files:**
- Create: `app/api/auth/sign-in/route.ts`
- Create: `app/api/auth/sign-out/route.ts`
- Create: `app/api/auth/callback/logto/route.ts`

**Step 1: Create sign-in route**

```typescript
import { logtoClient } from '@/lib/logto-client'
import { redirect } from 'next/navigation'

export async function GET() {
  return redirect(await logtoClient.getSignInUrl())
}
```

**Step 2: Create sign-out route**

```typescript
import { logtoClient } from '@/lib/logto-client'
import { redirect } from 'next/navigation'

export async function GET() {
  return redirect(await logtoClient.getSignOutUrl())
}
```

**Step 3: Create callback route**

```typescript
import { logtoClient } from '@/lib/logto-client'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  await logtoClient.handleAuthCallback(searchParams)
  redirect('/')
}
```

**Step 4: Create Logto client wrapper**

**Files:**
- Create: `lib/logto-client.ts`

```typescript
import { LogtoClient } from '@logto/next'
import { logtoConfig } from './logto'

export const logtoClient = new LogtoClient(logtoConfig)
```

**Step 5: Commit**

```bash
git add app/api/auth lib/logto-client.ts
git commit -m "feat: add auth API routes"
```

---

### Task 4: Create Middleware for Auth Protection

**Files:**
- Create: `middleware.ts`

**Step 1: Create middleware**

```typescript
import { logtoClient } from '@/lib/logto-client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isAuthenticated = await logtoClient.isAuthenticated()

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/api/auth/sign-in', request.url))
    }
    // TODO: Check admin role after user system is set up
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

**Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware"
```

---

## Phase 2: Database Schema Updates

### Task 5: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add User model**

```prisma
// User: synced from Logto
model User {
  id           String    @id
  email        String?   @unique
  name         String?
  avatar       String?
  role         String    @default("user") // user | admin
  createdAt    DateTime  @default(now())
  lastActiveAt DateTime  @default(now())

  // Relations
  sessions     Session[]
  prdLogs      PRDLog[]
}

// Update Session model - add userId
model Session {
  id          String   @id @default(cuid())
  userId      String?  // Optional for backward compatibility
  user        User?    @relation(fields: [userId], references: [id])
  title       String
  prdId       String?  @unique
  currentStep Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  messages    Message[]
  prd         PRD?

  @@index([userId])
}

// PRDLog: track PRD generation events
model PRDLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  sessionId   String
  title       String
  status      String   // success | failed | pending
  aiModel     String   @default("GLM-4")
  tokensUsed  Int?
  duration    Int      // generation time in seconds
  error       String?
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@index([status])
}

// DailyStats: aggregated statistics
model DailyStats {
  id          String   @id @default(cuid())
  date        DateTime @db.Date
  newUsers    Int      @default(0)
  activeUsers Int      @default(0)
  prdGenerated Int     @default(0)
  prdSuccess  Float    @default(0) // success rate
  totalTokens Int      @default(0)
  avgDuration Float?

  @@unique([date])
}
```

**Step 2: Generate Prisma client**

Run: `npx prisma generate`

**Step 3: Push schema to database**

Run: `npx prisma db push`

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add User, PRDLog, DailyStats models"
```

---

### Task 6: Create User Sync Service

**Files:**
- Create: `lib/user-sync.ts`

**Step 1: Create user sync function**

```typescript
import { prisma } from '@/lib/prisma'

interface LogtoUserInfo {
  sub: string       // user ID
  email?: string
  name?: string
  picture?: string
}

export async function syncUserFromLogto(userInfo: LogtoUserInfo) {
  const existing = await prisma.user.findUnique({
    where: { id: userInfo.sub }
  })

  if (existing) {
    // Update last active time
    return await prisma.user.update({
      where: { id: userInfo.sub },
      data: {
        lastActiveAt: new Date(),
        ...(userInfo.email && { email: userInfo.email }),
        ...(userInfo.name && { name: userInfo.name }),
        ...(userInfo.picture && { avatar: userInfo.picture })
      }
    })
  }

  // Create new user
  return await prisma.user.create({
    data: {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture,
      lastActiveAt: new Date()
    }
  })
}
```

**Step 2: Commit**

```bash
git add lib/user-sync.ts
git commit -m "feat: add user sync service from Logto"
```

---

## Phase 3: Data Analytics & Tracking

### Task 7: Create Analytics Service

**Files:**
- Create: `lib/analytics.ts`

**Step 1: Create analytics tracking functions**

```typescript
import { prisma } from '@/lib/prisma'

interface TrackPRDGenerationParams {
  userId: string
  sessionId: string
  title: string
  status: 'success' | 'failed' | 'pending'
  aiModel?: string
  tokensUsed?: number
  duration: number
  error?: string
}

export async function trackPRDGeneration(params: TrackPRDGenerationParams) {
  return await prisma.pRDLog.create({
    data: params
  })
}

export async function incrementActiveUsers(date: Date) {
  const stats = await prisma.dailyStats.findUnique({
    where: { date }
  })

  if (stats) {
    return await prisma.dailyStats.update({
      where: { date },
      data: { activeUsers: { increment: 1 } }
    })
  }

  return await prisma.dailyStats.create({
    data: {
      date,
      activeUsers: 1
    }
  })
}

export async function incrementNewUsers(date: Date) {
  const stats = await prisma.dailyStats.findUnique({
    where: { date }
  })

  if (stats) {
    return await prisma.dailyStats.update({
      where: { date },
      data: { newUsers: { increment: 1 } }
    })
  }

  return await prisma.dailyStats.create({
    data: {
      date,
      newUsers: 1
    }
  })
}

export async function incrementPRDGenerated(date: Date, status: 'success' | 'failed') {
  const stats = await prisma.dailyStats.findUnique({
    where: { date }
  })

  if (!stats) {
    return await prisma.dailyStats.create({
      data: {
        date,
        prdGenerated: 1,
        prdSuccess: status === 'success' ? 100 : 0
      }
    })
  }

  const newGenerated = stats.prdGenerated + 1
  const successCount = Math.round(stats.prdGenerated * (stats.prdSuccess / 100))
  const newSuccessCount = successCount + (status === 'success' ? 1 : 0)
  const newSuccessRate = (newSuccessCount / newGenerated) * 100

  return await prisma.dailyStats.update({
    where: { date },
    data: {
      prdGenerated: newGenerated,
      prdSuccess: newSuccessRate
    }
  })
}
```

**Step 2: Commit**

```bash
git add lib/analytics.ts
git commit -m "feat: add analytics tracking service"
```

---

### Task 8: Add Tracking to PRD Generate API

**Files:**
- Modify: `app/api/prd/generate/route.ts`

**Step 1: Add tracking before implementation**

First, read the existing route to understand the structure:

Run: `cat app/api/prd/generate/route.ts`

**Step 2: Add timing and tracking**

Wrap the existing logic with timing:

```typescript
import { trackPRDGeneration } from '@/lib/analytics'
// ... other imports

export async function POST(request: Request) {
  const startTime = Date.now()
  let userId = 'anonymous' // TODO: Get from session after auth
  let status: 'success' | 'failed' = 'success'

  try {
    // ... existing PRD generation logic ...

    const duration = Math.round((Date.now() - startTime) / 1000)

    // Track successful generation
    await trackPRDGeneration({
      userId,
      sessionId: body.sessionId,
      title: 'Generated PRD', // or extract from response
      status: 'success',
      duration,
      tokensUsed: response.usage?.total_tokens
    })

    return NextResponse.json({ ...existingResponse })

  } catch (error) {
    status = 'failed'
    const duration = Math.round((Date.now() - startTime) / 1000)

    // Track failed generation
    await trackPRDGeneration({
      userId,
      sessionId: body.sessionId,
      title: 'Failed PRD',
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

### Task 9: Create Daily Stats Job

**Files:**
- Create: `app/api/cron/daily-stats/route.ts`

**Step 1: Create cron job route**

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate stats from PRDLog
  const prdLogs = await prisma.pRDLog.findMany({
    where: {
      createdAt: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  })

  const prdGenerated = prdLogs.length
  const successCount = prdLogs.filter(l => l.status === 'success').length
  const avgDuration = prdLogs.length > 0
    ? prdLogs.reduce((sum, log) => sum + log.duration, 0) / prdLogs.length
    : null
  const totalTokens = prdLogs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0)

  await prisma.dailyStats.upsert({
    where: { date: today },
    create: {
      date: today,
      prdGenerated,
      prdSuccess: prdGenerated > 0 ? (successCount / prdGenerated) * 100 : 0,
      avgDuration,
      totalTokens
    },
    update: {
      prdGenerated,
      prdSuccess: prdGenerated > 0 ? (successCount / prdGenerated) * 100 : 0,
      avgDuration,
      totalTokens
    }
  })

  return NextResponse.json({ success: true })
}
```

**Step 2: Update .env.example**

Add: `CRON_SECRET=your_random_cron_secret`

**Step 3: Commit**

```bash
git add app/api/cron/daily-stats/route.ts .env.example
git commit -m "feat: add daily stats aggregation job"
```

---

## Phase 4: Admin Dashboard

### Task 10: Create Admin API Routes

**Files:**
- Create: `app/api/admin/stats/route.ts`
- Create: `app/api/admin/users/route.ts`
- Create: `app/api/admin/prd-logs/route.ts`

**Step 1: Create stats API**

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const stats = await prisma.dailyStats.findMany({
    orderBy: { date: 'desc' },
    take: 30
  })

  const todayStats = await prisma.dailyStats.findUnique({
    where: { date: today }
  })

  return NextResponse.json({
    today: todayStats || { newUsers: 0, activeUsers: 0, prdGenerated: 0 },
    history: stats
  })
}
```

**Step 2: Create users API**

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sessions: true, prdLogs: true }
        }
      }
    }),
    prisma.user.count()
  ])

  return NextResponse.json({
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  })
}
```

**Step 3: Create PRD logs API**

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const status = searchParams.get('status')

  const where = status ? { status } : {}

  const [logs, total] = await Promise.all([
    prisma.pRDLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    }),
    prisma.pRDLog.count({ where })
  ])

  return NextResponse.json({
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  })
}
```

**Step 4: Commit**

```bash
git add app/api/admin
git commit -m "feat: add admin API routes"
```

---

### Task 11: Create Admin Layout

**Files:**
- Create: `app/admin/layout.tsx`

**Step 1: Create admin layout**

```typescript
import { redirect } from 'next/navigation'
import { logtoClient } from '@/lib/logto-client'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = await logtoClient.isAuthenticated()

  if (!isAuthenticated) {
    redirect('/api/auth/sign-in')
  }

  // TODO: Check admin role after auth is fully implemented

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm text-gray-600">Back to App</a>
              <a href="/api/auth/sign-out" className="text-sm text-red-600">Sign Out</a>
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

**Step 2: Commit**

```bash
git add app/admin/layout.tsx
git commit -m "feat: add admin layout with auth protection"
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
import { Users, FileText, TrendingUp, Activity } from 'lucide-react'

async function getAdminStats() {
  // TODO: Fetch from API after implementation
  return {
    today: {
      newUsers: 12,
      activeUsers: 45,
      prdGenerated: 23,
      successRate: 95.5
    }
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="New Users Today"
          value={stats.today.newUsers}
          icon={<Users className="w-6 h-6" />}
        />
        <StatsCard
          title="Active Users Today"
          value={stats.today.activeUsers}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatsCard
          title="PRDs Generated Today"
          value={stats.today.prdGenerated}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatsCard
          title="Success Rate"
          value={`${stats.today.successRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {/* TODO: Add charts for trends */}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/admin/page.tsx components/admin/StatsCard.tsx
git commit -m "feat: add admin overview page"
```

---

### Task 13: Create Users Management Page

**Files:**
- Create: `app/admin/users/page.tsx`
- Create: `components/admin/UserTable.tsx`

**Step 1: Create UserTable component**

```typescript
interface User {
  id: string
  email: string | null
  name: string | null
  createdAt: Date
  lastActiveAt: Date
  _count: { sessions: number; prdLogs: number }
}

interface UserTableProps {
  users: User[]
}

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRDs</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.name || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user.email || 'No email'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user._count.sessions}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user._count.prdLogs}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.lastActiveAt).toLocaleDateString()}
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
import { UserTable } from '@/components/admin/UserTable'

async function getUsers() {
  // TODO: Fetch from API
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users`, {
    cache: 'no-store'
  })
  const data = await res.json()
  return data.users
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Users</h2>
      <UserTable users={users} />

      {/* TODO: Add pagination */}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/admin/users/page.tsx components/admin/UserTable.tsx
git commit -m "feat: add users management page"
```

---

### Task 14: Create PRD Logs Page

**Files:**
- Create: `app/admin/prd-logs/page.tsx`
- Create: `components/admin/PRDLogTable.tsx`

**Step 1: Create PRDLogTable component**

```typescript
interface PRDLog {
  id: string
  title: string
  status: string
  duration: number
  tokensUsed: number | null
  createdAt: Date
  user: { name: string | null; email: string | null }
}

interface PRDLogTableProps {
  logs: PRDLog[]
}

export function PRDLogTable({ logs }: PRDLogTableProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {log.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {log.user.name || log.user.email || 'Unknown'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {log.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.duration}s
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.tokensUsed || '-'}
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
import { PRDLogTable } from '@/components/admin/PRDLogTable'

async function getPRDLogs() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/prd-logs`, {
    cache: 'no-store'
  })
  const data = await res.json()
  return data.logs
}

export default async function PRDLogsPage() {
  const logs = await getPRDLogs()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">PRD Generation Logs</h2>
      <PRDLogTable logs={logs} />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/admin/prd-logs/page.tsx components/admin/PRDLogTable.tsx
git commit -m "feat: add PRD logs page"
```

---

## Phase 5: Third-Party Integrations

### Task 15: Integrate Vercel Analytics

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Install Vercel Analytics**

Run: `npm install @vercel/analytics`

**Step 2: Add Analytics to root layout**

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
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

### Task 16: Integrate Sentry for Error Tracking

**Files:**
- Create: `lib/sentry.ts`
- Modify: `app/layout.tsx`

**Step 1: Install Sentry SDK**

Run: `npm install @sentry/nextjs`

**Step 2: Create Sentry config**

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

**Step 3: Update .env.example**

Add: `NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn`

**Step 4: Add Sentry to layout**

```typescript
import { Analytics } from '@vercel/analytics/react'
import { SentryLive } from '@/components/SentryLive'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Analytics />
        <SentryLive />
      </body>
    </html>
  )
}
```

**Step 5: Commit**

```bash
git add lib/sentry.ts app/layout.tsx .env.example
git commit -m "feat: add Sentry error tracking"
```

---

### Task 17: (Optional) Integrate PostHog

**Files:**
- Create: `lib/posthog.ts`
- Modify: `app/layout.tsx`

**Step 1: Install PostHog**

Run: `npm install posthog-js posthog-node`

**Step 2: Create PostHog client**

```typescript
import { PostHog } from 'posthog-node'

export const posthogClient = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: 'https://app.posthog.com' }
)
```

**Step 3: Add PostHog provider to layout**

```typescript
import PostHogPageView from '@/components/PostHogPageView'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <PostHogPageView />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Step 4: Commit**

```bash
git add lib/posthog.ts app/layout.tsx components/PostHogPageView.tsx .env.example
git commit -m "feat: add PostHog analytics"
```

---

## Final Tasks

### Task 18: Create Documentation

**Files:**
- Create: `docs/ADMIN_GUIDE.md`
- Create: `docs/DEPLOYMENT_WITH_AUTH.md`

**Step 1: Write admin guide**

```markdown
# Admin Dashboard Guide

## Access

1. Go to `/admin`
2. Sign in with WeChat or GitHub
3. Your account must have `role: admin` in the database

## Features

- **Overview**: See daily statistics
- **Users**: View all users and their activity
- **PRD Logs**: Track all PRD generations
- **System Health**: Monitor via Sentry

## Set First Admin

Run in database:
```sql
UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com';
```
```

**Step 2: Write deployment guide**

```markdown
# Deployment with Authentication

## Environment Variables

Add these to your hosting platform:

\`\`\`
LOGTO_ENDPOINT=https://your-logto-app.logto.app
LOGTO_APP_ID=your_app_id
LOGTO_APP_SECRET=your_app_secret
LOGTO_COOKIE_SECRET=generate_with_openssl_rand
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
CRON_SECRET=generate_random_secret
\`\`\`

## Logto Setup

1. Create account at https://logto.io
2. Create application: Next.js (SSR)
3. Enable WeChat sign-in
4. Copy credentials to env vars

## Database Migration

Run: \`npx prisma db push\`

## Set Admin User

After first login, update role in database.
```

**Step 3: Commit**

```bash
git add docs/
git commit -m "docs: add admin and deployment guides"
```

---

## Testing Checklist

### Task 19: Integration Testing

**Test Plan:**

1. **Authentication Flow**
   - [ ] Sign in with WeChat/GitHub
   - [ ] User syncs to database
   - [ ] Protected routes redirect correctly

2. **Data Tracking**
   - [ ] PRD generation creates log entry
   - [ ] Daily stats aggregate correctly
   - [ ] Cron job runs successfully

3. **Admin Dashboard**
   - [ ] Overview displays stats
   - [ ] User list loads
   - [ ] PRD logs show entries
   - [ ] Non-admin users are blocked

4. **Third-Party**
   - [ ] Vercel Analytics records page views
   - [ ] Sentry captures errors
   - [ ] PostHog tracks events (if used)

**Step 1: Run manual tests**

Go through checklist above

**Step 2: Commit**

```bash
git commit --allow-empty -m "test: complete integration testing"
```

---

## Summary

This plan implements:

✅ User authentication with Logto (WeChat login support)
✅ Database schema for users, analytics, and statistics
✅ Custom event tracking for PRD generations
✅ Admin dashboard with overview, users, and logs
✅ Third-party integrations (Vercel Analytics, Sentry)
✅ Complete documentation

**Estimated timeline:** 1-2 weeks
**Total commits:** ~19 commits

---

## Next Steps

After plan is saved, you have two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
