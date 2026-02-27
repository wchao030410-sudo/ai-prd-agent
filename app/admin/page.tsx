'use client'

import { useEffect, useState } from 'react'
import { StatsCard } from '@/components/admin/StatsCard'
import { Users, FileText, Activity, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface DayStats {
  date: string
  uniqueUsers: number
  totalVisits: number
  prdGenerated: number
  prdSuccess: number
  errorCount: number
  totalTokens: number
}

interface StatsData {
  today: DayStats
  history: DayStats[]
  summary: {
    totalUniqueUsers: number
    totalVisits: number
    totalPRDs: number
    totalTokens: number
    avgSuccessRate: number
  }
}

function TrendValue({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const change = ((current - previous) / previous) * 100
  const isPositive = change >= 0

  return (
    <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(change).toFixed(1)}%
    </div>
  )
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      try {
        const [todayRes, historyRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/stats/history?days=7')
        ])

        if (!todayRes.ok || !historyRes.ok) {
          throw new Error('Failed to fetch stats')
        }

        const todayData = await todayRes.json()
        const historyData = await historyRes.json()

        setStats({ ...todayData, ...historyData })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-100"></div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-600 dark:text-red-400">Error: {error || 'Failed to load stats'}</p>
      </div>
    )
  }

  const history = stats.history || []
  const today = stats.today || { uniqueUsers: 0, totalVisits: 0, prdGenerated: 0, errorCount: 0 }
  const summary = stats.summary || {}

  // Get yesterday's stats for comparison
  const yesterday = history.length > 1 ? history[history.length - 2] : null

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Today&apos;s Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Unique Users"
          value={today.uniqueUsers || 0}
          icon={<Users className="w-6 h-6" />}
          trend={<TrendValue current={today.uniqueUsers || 0} previous={yesterday?.uniqueUsers || 0} />}
        />
        <StatsCard
          title="Total Visits"
          value={today.totalVisits || 0}
          icon={<Activity className="w-6 h-6" />}
          trend={<TrendValue current={today.totalVisits || 0} previous={yesterday?.totalVisits || 0} />}
        />
        <StatsCard
          title="PRDs Generated"
          value={today.prdGenerated || 0}
          icon={<FileText className="w-6 h-6" />}
          trend={<TrendValue current={today.prdGenerated || 0} previous={yesterday?.prdGenerated || 0} />}
        />
        <StatsCard
          title="Errors"
          value={today.errorCount || 0}
          icon={<AlertCircle className="w-6 h-6" />}
          trend={<TrendValue current={today.errorCount || 0} previous={yesterday?.errorCount || 0} />}
        />
      </div>

      {/* 7-Day Summary */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">7-Day Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Unique Users</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalUniqueUsers || 0}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Visits</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalVisits || 0}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total PRDs Generated</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalPRDs || 0}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Tokens Used</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{(summary.totalTokens || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Historical Data (Last 7 Days)</h3>
        <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Unique Users</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Total Visits</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">PRDs</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Success Rate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {history.map((day, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{day.date}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{day.uniqueUsers}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{day.totalVisits}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{day.prdGenerated}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{day.prdSuccess.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{day.totalTokens.toLocaleString()}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No historical data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
