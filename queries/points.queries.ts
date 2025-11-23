import { queryOptions } from '@tanstack/react-query'
import { fetchPointHistory } from '@/lib/actions/points'

export const pointsQueries = {
  history: (userId: string, limit = 50) =>
    queryOptions({
      queryKey: ['admin-pointHistory', userId, limit] as const,
      queryFn: () => fetchPointHistory(userId, limit),
      enabled: !!userId,
    }),
}
