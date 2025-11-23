import { queryOptions } from '@tanstack/react-query'
import { fetchDashboardSummary } from '@/lib/actions/dashboard'

export const dashboardQueries = {
  summary: () =>
    queryOptions({
      queryKey: ['admin-dashboard', 'summary'] as const,
      queryFn: () => fetchDashboardSummary(),
      staleTime: 60 * 1000,
    }),
}
