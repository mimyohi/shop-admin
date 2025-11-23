import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  deleteAdminUser as deleteAdminUserAction,
  fetchAdminUsers,
  resetAdminPassword as resetAdminPasswordAction,
} from '@/lib/actions/admin-users'

export const adminUsersQueries = {
  all: () => ['admin-adminUsers'] as const,

  list: (filters: { is_active?: boolean } = {}) =>
    queryOptions({
      queryKey: [...adminUsersQueries.all(), filters] as const,
      queryFn: () => fetchAdminUsers(filters),
    }),
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAdminUserAction(id),
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
    }) => resetAdminPasswordAction({ masterAdminId, targetAdminId, newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersQueries.all() })
    },
  })
}
