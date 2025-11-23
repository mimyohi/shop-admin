import { queryOptions } from '@tanstack/react-query'
import { pointsRepository } from '@/repositories/points.repository'

export const pointsQueries = {
  history: (userId: string, limit = 50) =>
    queryOptions({
      queryKey: ['admin-pointHistory', userId, limit] as const,
      queryFn: () => pointsRepository.findHistoryByUserId(userId, limit),
      enabled: !!userId,
    }),
}
