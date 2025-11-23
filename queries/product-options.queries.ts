import { queryOptions } from '@tanstack/react-query'
import { productOptionsRepository } from '@/repositories/product-options.repository'

export const productOptionsQueries = {
  configuration: (productId: string) =>
    queryOptions({
      queryKey: ['admin-productOptions', productId] as const,
      queryFn: () => productOptionsRepository.findConfigurationByProductId(productId),
      enabled: !!productId,
      staleTime: 5 * 60 * 1000,
    }),
}
