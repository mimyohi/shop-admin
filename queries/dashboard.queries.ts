import { queryOptions } from '@tanstack/react-query'
import { dashboardRepository } from '@/repositories/dashboard.repository'

export const dashboardQueries = {
  summary: () =>
    queryOptions({
      queryKey: ['admin-dashboard', 'summary'] as const,
      queryFn: () => dashboardRepository.fetchSummary(),
      staleTime: 60 * 1000,
    }),
}
