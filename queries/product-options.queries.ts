import { queryOptions } from '@tanstack/react-query'
import { fetchProductConfiguration } from '@/lib/actions/product-options'

export const productOptionsQueries = {
  configuration: (productId: string) =>
    queryOptions({
      queryKey: ['admin-productOptions', productId] as const,
      queryFn: () => fetchProductConfiguration(productId),
      enabled: !!productId,
      staleTime: 5 * 60 * 1000,
    }),
}
