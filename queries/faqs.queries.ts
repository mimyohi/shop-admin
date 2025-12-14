import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchFAQs,
  fetchFAQ,
  createFAQ as createFAQAction,
  updateFAQ as updateFAQAction,
  deleteFAQ as deleteFAQAction,
  toggleFAQActive as toggleFAQActiveAction,
  updateFAQOrder as updateFAQOrderAction,
} from '@/lib/actions/faqs'
import { FAQFilters, CreateFAQData, UpdateFAQData } from '@/types/faqs.types'

export type { FAQFilters, CreateFAQData, UpdateFAQData } from '@/types/faqs.types'

export const faqsQueries = {
  all: () => ['admin-faqs'] as const,

  lists: () => [...faqsQueries.all(), 'list'] as const,

  list: (filters: FAQFilters = {}) =>
    queryOptions({
      queryKey: [...faqsQueries.lists(), filters] as const,
      queryFn: () => fetchFAQs(filters),
    }),

  details: () => [...faqsQueries.all(), 'detail'] as const,

  detail: (id: string) =>
    queryOptions({
      queryKey: [...faqsQueries.details(), id] as const,
      queryFn: () => fetchFAQ(id),
      enabled: !!id,
    }),
}

export function useCreateFAQ() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFAQData) => createFAQAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: faqsQueries.lists() })
    },
  })
}

export function useUpdateFAQ() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFAQData }) =>
      updateFAQAction(id, data),
    onSuccess: (updatedFAQ) => {
      queryClient.invalidateQueries({ queryKey: faqsQueries.lists() })
      queryClient.invalidateQueries({
        queryKey: faqsQueries.detail(updatedFAQ.id).queryKey,
      })
    },
  })
}

export function useDeleteFAQ() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteFAQAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: faqsQueries.lists() })
    },
  })
}

export function useToggleFAQActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleFAQActiveAction(id, isActive),
    onSuccess: (updatedFAQ) => {
      queryClient.invalidateQueries({ queryKey: faqsQueries.lists() })
      queryClient.invalidateQueries({
        queryKey: faqsQueries.detail(updatedFAQ.id).queryKey,
      })
    },
  })
}

export function useUpdateFAQOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (faqs: { id: string; display_order: number }[]) =>
      updateFAQOrderAction(faqs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: faqsQueries.lists() })
    },
  })
}
