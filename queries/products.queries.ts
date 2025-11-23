import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsRepository } from '@/repositories/products.repository'
import { ProductFilters, CreateProductData, UpdateProductData } from '@/types/products.types'

export type { ProductFilters, CreateProductData, UpdateProductData } from '@/types/products.types'

export const productsQueries = {
  all: () => ['admin-products'] as const,

  lists: () => [...productsQueries.all(), 'list'] as const,

  list: (filters: ProductFilters = {}) =>
    queryOptions({
      queryKey: [...productsQueries.lists(), filters] as const,
      queryFn: () => productsRepository.findMany(filters),
    }),

  details: () => [...productsQueries.all(), 'detail'] as const,

  detail: (id: string) =>
    queryOptions({
      queryKey: [...productsQueries.details(), id] as const,
      queryFn: () => productsRepository.findById(id),
      enabled: !!id,
    }),

  categories: () =>
    queryOptions({
      queryKey: [...productsQueries.all(), 'categories'] as const,
      queryFn: () => productsRepository.findCategories(),
      staleTime: 5 * 60 * 1000,
    }),
}

/**
 * 상품 생성 mutation
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productData: CreateProductData) => productsRepository.create(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueries.lists() })
    },
  })
}

/**
 * 상품 수정 mutation
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) =>
      productsRepository.update(id, data),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: productsQueries.lists() })
      queryClient.invalidateQueries({
        queryKey: productsQueries.detail(updatedProduct.id).queryKey,
      })
    },
  })
}

/**
 * 상품 삭제 mutation
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueries.lists() })
    },
  })
}
