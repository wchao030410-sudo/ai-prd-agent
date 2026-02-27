import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string | React.ReactNode
  icon?: React.ReactNode
  trend?: React.ReactNode
}

export function StatsCard({ title, value, change, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
          {change && typeof change === 'string' && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">{change}</p>
          )}
          {trend && (
            <div className="mt-2">{trend}</div>
          )}
        </div>
        {icon && (
          <div className="text-slate-400 dark:text-slate-600 ml-4">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
