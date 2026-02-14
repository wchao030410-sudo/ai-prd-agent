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
      <h2 className="text-2xl font-bold mb-6">Today&apos;s Overview</h2>

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
