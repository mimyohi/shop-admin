import { InstagramImage } from '@/models'

export interface InstagramImageFilters {
  isActive?: boolean
  page?: number
  limit?: number | 'all'
}

export interface CreateInstagramImageData {
  image_url: string
  link_url?: string
  display_order?: number
  is_active?: boolean
}

export interface UpdateInstagramImageData {
  image_url?: string
  link_url?: string | null
  display_order?: number
  is_active?: boolean
}

export interface InstagramImageListResponse {
  images: InstagramImage[]
  totalCount: number
  totalPages: number
  currentPage: number
}
