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
    data: {
      eventType: params.eventType,
      anonymousId: params.anonymousId,
      sessionId: params.sessionId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      duration: params.duration
    }
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
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Count unique users for today
  const uniqueUsersCount = await prisma.analyticsEvent.groupBy({
    by: ['anonymousId'],
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    }
  }).then(groups => groups.length)

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
        avgDuration: params.duration,
        uniqueUsers: uniqueUsersCount
      },
      update: {
        prdGenerated: newGenerated,
        prdSuccess: newSuccessRate,
        totalTokens: { increment: params.tokensUsed || 0 },
        avgDuration: params.duration,
        uniqueUsers: uniqueUsersCount,
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
        errorCount: 1,
        uniqueUsers: uniqueUsersCount
      },
      update: {
        prdGenerated: newGenerated,
        prdSuccess: newSuccessRate,
        errorCount: { increment: 1 },
        uniqueUsers: uniqueUsersCount
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
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Count unique users for today
  const uniqueUsersCount = await prisma.analyticsEvent.groupBy({
    by: ['anonymousId'],
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    }
  }).then(groups => groups.length)

  await prisma.dailyStats.upsert({
    where: { date: today },
    create: { date: today, totalVisits: 1, uniqueUsers: uniqueUsersCount },
    update: {
      totalVisits: { increment: 1 },
      uniqueUsers: uniqueUsersCount
    }
  })
}
