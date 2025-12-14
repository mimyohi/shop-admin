import { FAQ } from '@/models'

export interface FAQFilters {
  category?: string
  isActive?: boolean
  page?: number
  limit?: number | 'all'
}

export interface CreateFAQData {
  question: string
  answer: string
  category?: string
  display_order?: number
  is_active?: boolean
}

export interface UpdateFAQData {
  question?: string
  answer?: string
  category?: string | null
  display_order?: number
  is_active?: boolean
}

export interface FAQListResponse {
  faqs: FAQ[]
  totalCount: number
  totalPages: number
  currentPage: number
}
