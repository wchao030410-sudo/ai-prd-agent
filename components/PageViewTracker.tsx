'use client'

import { usePageViewTracking } from '@/hooks/use-page-view-tracking'

export function PageViewTracker() {
  usePageViewTracking()
  return null
}
