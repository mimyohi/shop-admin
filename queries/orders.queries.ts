import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchConsultationStatusCounts,
  fetchOrder,
  fetchOrderStats,
  fetchOrders,
  updateOrderStatus,
} from '@/lib/actions/orders'
import { OrderFilters } from '@/types/orders.types'

export type { OrderFilters } from '@/types/orders.types'

export const ordersQueries = {
  all: () => ['admin-orders'] as const,

  lists: () => [...ordersQueries.all(), 'list'] as const,

  list: (filters: OrderFilters = {}) =>
    queryOptions({
      queryKey: [...ordersQueries.lists(), filters] as const,
      queryFn: () => fetchOrders(filters),
    }),

  details: () => [...ordersQueries.all(), 'detail'] as const,

  detail: (id: string) =>
    queryOptions({
      queryKey: [...ordersQueries.details(), id] as const,
      queryFn: () => fetchOrder(id),
      enabled: !!id,
    }),

  stats: () =>
    queryOptions({
      queryKey: [...ordersQueries.all(), 'stats'] as const,
      queryFn: () => fetchOrderStats(),
      staleTime: 60 * 1000, // 1분
    }),
  consultationStatusCounts: (statuses: string[]) =>
    queryOptions({
      queryKey: [...ordersQueries.all(), 'consultation-status-counts', statuses] as const,
      queryFn: () => fetchConsultationStatusCounts(statuses),
      staleTime: 5 * 60 * 1000,
    }),
}

/**
 * 주문 상태 업데이트 mutation
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      paymentKey,
    }: {
      orderId: string
      status: string
      paymentKey?: string
    }) => updateOrderStatus(orderId, status, paymentKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueries.lists() })
      queryClient.invalidateQueries({ queryKey: ordersQueries.stats().queryKey })
    },
  })
}
