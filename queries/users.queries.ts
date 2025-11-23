import { queryOptions } from '@tanstack/react-query'
import { usersRepository } from '@/repositories/users.repository'
import { UserFilters } from '@/types/users.types'

export type { UserFilters } from '@/types/users.types'

export const usersQueries = {
  all: () => ['admin-users'] as const,

  lists: () => [...usersQueries.all(), 'list'] as const,

  list: (filters: UserFilters = {}) =>
    queryOptions({
      queryKey: [...usersQueries.lists(), filters] as const,
      queryFn: () => usersRepository.findMany(filters),
    }),

  details: () => [...usersQueries.all(), 'detail'] as const,

  detail: (userId: string) =>
    queryOptions({
      queryKey: [...usersQueries.details(), userId] as const,
      queryFn: () => usersRepository.findById(userId),
      enabled: !!userId,
    }),

  stats: () =>
    queryOptions({
      queryKey: [...usersQueries.all(), 'stats'] as const,
      queryFn: () => usersRepository.getStats(),
      staleTime: 60 * 1000, // 1분
    }),
}
