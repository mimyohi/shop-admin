import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminUsersRepository } from '@/repositories/admin-users.repository'

export const adminUsersQueries = {
  all: () => ['admin-adminUsers'] as const,

  list: (filters: { is_active?: boolean } = {}) =>
    queryOptions({
      queryKey: [...adminUsersQueries.all(), filters] as const,
      queryFn: () => adminUsersRepository.findMany(filters),
    }),
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminUsersRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersQueries.all() })
    },
  })
}

export function useResetAdminPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      masterAdminId,
      targetAdminId,
      newPassword,
    }: {
      masterAdminId: string
      targetAdminId: string
      newPassword: string
    }) => adminUsersRepository.resetPassword(masterAdminId, targetAdminId, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersQueries.all() })
    },
  })
}
