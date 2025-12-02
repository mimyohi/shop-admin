import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMainBanners,
  fetchMainBanner,
  createMainBanner as createMainBannerAction,
  updateMainBanner as updateMainBannerAction,
  deleteMainBanner as deleteMainBannerAction,
  toggleMainBannerActive as toggleMainBannerActiveAction,
  updateMainBannerOrder as updateMainBannerOrderAction,
  fetchProductBanners,
  fetchProductBanner,
  createProductBanner as createProductBannerAction,
  updateProductBanner as updateProductBannerAction,
  deleteProductBanner as deleteProductBannerAction,
  toggleProductBannerActive as toggleProductBannerActiveAction,
  updateProductBannerOrder as updateProductBannerOrderAction,
} from '@/lib/actions/banners'
import { BannerFilters, CreateBannerData, UpdateBannerData } from '@/types/banners.types'

export type { BannerFilters, CreateBannerData, UpdateBannerData } from '@/types/banners.types'

// ==================== 메인 배너 Queries ====================

export const mainBannersQueries = {
  all: () => ['admin-main-banners'] as const,

  lists: () => [...mainBannersQueries.all(), 'list'] as const,

  list: (filters: BannerFilters = {}) =>
    queryOptions({
      queryKey: [...mainBannersQueries.lists(), filters] as const,
      queryFn: () => fetchMainBanners(filters),
    }),

  details: () => [...mainBannersQueries.all(), 'detail'] as const,

  detail: (id: string) =>
    queryOptions({
      queryKey: [...mainBannersQueries.details(), id] as const,
      queryFn: () => fetchMainBanner(id),
      enabled: !!id,
    }),
}

export function useCreateMainBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBannerData) => createMainBannerAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mainBannersQueries.lists() })
    },
  })
}

export function useUpdateMainBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBannerData }) =>
      updateMainBannerAction(id, data),
    onSuccess: (updatedBanner) => {
      queryClient.invalidateQueries({ queryKey: mainBannersQueries.lists() })
      queryClient.invalidateQueries({
        queryKey: mainBannersQueries.detail(updatedBanner.id).queryKey,
      })
    },
  })
}

export function useDeleteMainBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteMainBannerAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mainBannersQueries.lists() })
    },
  })
}

export function useToggleMainBannerActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleMainBannerActiveAction(id, isActive),
    onSuccess: (updatedBanner) => {
      queryClient.invalidateQueries({ queryKey: mainBannersQueries.lists() })
      queryClient.invalidateQueries({
        queryKey: mainBannersQueries.detail(updatedBanner.id).queryKey,
      })
    },
  })
}

export function useUpdateMainBannerOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (banners: { id: string; display_order: number }[]) =>
      updateMainBannerOrderAction(banners),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mainBannersQueries.lists() })
    },
  })
}

// ==================== 상품 배너 Queries ====================

export const productBannersQueries = {
  all: () => ['admin-product-banners'] as const,

  lists: () => [...productBannersQueries.all(), 'list'] as const,

  list: (filters: BannerFilters = {}) =>
    queryOptions({
      queryKey: [...productBannersQueries.lists(), filters] as const,
      queryFn: () => fetchProductBanners(filters),
    }),

  details: () => [...productBannersQueries.all(), 'detail'] as const,

  detail: (id: string) =>
    queryOptions({
      queryKey: [...productBannersQueries.details(), id] as const,
      queryFn: () => fetchProductBanner(id),
      enabled: !!id,
    }),
}

export function useCreateProductBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBannerData) => createProductBannerAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productBannersQueries.lists() })
    },
  })
}

export function useUpdateProductBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBannerData }) =>
      updateProductBannerAction(id, data),
    onSuccess: (updatedBanner) => {
      queryClient.invalidateQueries({ queryKey: productBannersQueries.lists() })
      queryClient.invalidateQueries({
        queryKey: productBannersQueries.detail(updatedBanner.id).queryKey,
      })
    },
  })
}

export function useDeleteProductBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProductBannerAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productBannersQueries.lists() })
    },
  })
}

export function useToggleProductBannerActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleProductBannerActiveAction(id, isActive),
    onSuccess: (updatedBanner) => {
      queryClient.invalidateQueries({ queryKey: productBannersQueries.lists() })
      queryClient.invalidateQueries({
        queryKey: productBannersQueries.detail(updatedBanner.id).queryKey,
      })
    },
  })
}

export function useUpdateProductBannerOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (banners: { id: string; display_order: number }[]) =>
      updateProductBannerOrderAction(banners),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productBannersQueries.lists() })
    },
  })
}
