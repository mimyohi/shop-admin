import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchHomeProducts,
  fetchAllProducts,
  setHomeProducts as setHomeProductsAction,
  updateHomeProductOrder as updateHomeProductOrderAction,
  removeHomeProduct as removeHomeProductAction,
  addHomeProduct as addHomeProductAction,
} from '@/lib/actions/home-products'

// ==================== 홈 상품 Queries ====================

export const homeProductsQueries = {
  all: () => ['admin-home-products'] as const,

  list: () =>
    queryOptions({
      queryKey: [...homeProductsQueries.all(), 'list'] as const,
      queryFn: () => fetchHomeProducts(),
    }),

  allProducts: () =>
    queryOptions({
      queryKey: [...homeProductsQueries.all(), 'all-products'] as const,
      queryFn: () => fetchAllProducts(),
    }),
}

export function useSetHomeProducts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productIds: string[]) => setHomeProductsAction(productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeProductsQueries.all() })
    },
  })
}

export function useUpdateHomeProductOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderUpdates: { id: string; display_order: number }[]) =>
      updateHomeProductOrderAction(orderUpdates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeProductsQueries.all() })
    },
  })
}

export function useRemoveHomeProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeHomeProductAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeProductsQueries.all() })
    },
  })
}

export function useAddHomeProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => addHomeProductAction(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeProductsQueries.all() })
    },
  })
}
