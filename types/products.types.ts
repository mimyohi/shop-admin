import { Product } from '@/models'

export interface ProductFilters {
  search?: string
  category?: string
  page?: number
  limit?: number | 'all'
}

export interface CreateProductData {
  name: string
  slug?: string
  description: string
  price: number
  image_url: string
  detail_images?: string[]
  stock: number
  category: string
  is_visible_on_main?: boolean
  sale_start_at?: string | null
  sale_end_at?: string | null
}

export interface UpdateProductData {
  name?: string
  slug?: string
  description?: string
  price?: number
  image_url?: string
  detail_images?: string[]
  stock?: number
  category?: string
  is_visible_on_main?: boolean
  sale_start_at?: string | null
  sale_end_at?: string | null
}

export interface ProductListResponse {
  products: Product[]
  totalCount: number
  totalPages: number
  currentPage: number
}
