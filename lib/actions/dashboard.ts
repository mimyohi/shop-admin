'use server'

import { dashboardRepository } from '@/repositories/dashboard.repository'

export async function fetchDashboardSummary() {
  return dashboardRepository.fetchSummary()
}
