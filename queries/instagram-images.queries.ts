import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchInstagramImages,
  fetchInstagramImage,
  createInstagramImage as createInstagramImageAction,
  updateInstagramImage as updateInstagramImageAction,
  deleteInstagramImage as deleteInstagramImageAction,
  toggleInstagramImageActive as toggleInstagramImageActiveAction,
  updateInstagramImageOrder as updateInstagramImageOrderAction,
} from '@/lib/actions/instagram-images'
import { InstagramImageFilters, CreateInstagramImageData, UpdateInstagramImageData } from '@/types/instagram-images.types'

export type { InstagramImageFilters, CreateInstagramImageData, UpdateInstagramImageData } from '@/types/instagram-images.types'

export const instagramImagesQueries = {
  all: () => ['admin-instagram-images'] as const,

  lists: () => [...instagramImagesQueries.all(), 'list'] as const,

  list: (filters: InstagramImageFilters = {}) =>
    queryOptions({
      queryKey: [...instagramImagesQueries.lists(), filters] as const,
      queryFn: () => fetchInstagramImages(filters),
    }),

  details: () => [...instagramImagesQueries.all(), 'detail'] as const,

  detail: (id: string) =>
    queryOptions({
      queryKey: [...instagramImagesQueries.details(), id] as const,
      queryFn: () => fetchInstagramImage(id),
      enabled: !!id,
    }),
}

export function useCreateInstagramImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInstagramImageData) => createInstagramImageAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramImagesQueries.lists() })
    },
  })
}

export function useUpdateInstagramImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInstagramImageData }) =>
      updateInstagramImageAction(id, data),
    onSuccess: (updatedImage) => {
      queryClient.invalidateQueries({ queryKey: instagramImagesQueries.lists() })
      queryClient.invalidateQueries({
        queryKey: instagramImagesQueries.detail(updatedImage.id).queryKey,
      })
    },
  })
}

export function useDeleteInstagramImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteInstagramImageAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramImagesQueries.lists() })
    },
  })
}

export function useToggleInstagramImageActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleInstagramImageActiveAction(id, isActive),
    onSuccess: (updatedImage) => {
      queryClient.invalidateQueries({ queryKey: instagramImagesQueries.lists() })
      queryClient.invalidateQueries({
        queryKey: instagramImagesQueries.detail(updatedImage.id).queryKey,
      })
    },
  })
}

export function useUpdateInstagramImageOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (images: { id: string; display_order: number }[]) =>
      updateInstagramImageOrderAction(images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instagramImagesQueries.lists() })
    },
  })
}
