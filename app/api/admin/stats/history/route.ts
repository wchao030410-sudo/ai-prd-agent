import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '7')

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days + 1)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  const stats = await prisma.dailyStats.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  // Fill missing days with zeros
  const result = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayStr = currentDate.toISOString().split('T')[0]
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)

    const existingStat = stats.find(s => {
      const statDate = new Date(s.date)
      statDate.setHours(0, 0, 0, 0)
      return statDate.getTime() === dayStart.getTime()
    })

    result.push({
      date: dayStr,
      uniqueUsers: existingStat?.uniqueUsers || 0,
      totalVisits: existingStat?.totalVisits || 0,
      prdGenerated: existingStat?.prdGenerated || 0,
      prdSuccess: existingStat?.prdSuccess || 0,
      errorCount: existingStat?.errorCount || 0,
      totalTokens: existingStat?.totalTokens || 0
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return NextResponse.json({
    history: result,
    summary: {
      totalUniqueUsers: result.reduce((sum, day) => sum + day.uniqueUsers, 0),
      totalVisits: result.reduce((sum, day) => sum + day.totalVisits, 0),
      totalPRDs: result.reduce((sum, day) => sum + day.prdGenerated, 0),
      totalTokens: result.reduce((sum, day) => sum + day.totalTokens, 0),
      avgSuccessRate: result.length > 0
        ? result.reduce((sum, day) => sum + day.prdSuccess, 0) / result.filter(d => d.prdGenerated > 0).length || 0
        : 0
    }
  })
}
