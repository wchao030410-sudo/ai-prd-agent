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
