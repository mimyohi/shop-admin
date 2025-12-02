import { MainBanner, ProductBanner, DeviceType, LinkTarget } from '@/models'

export type BannerType = 'main' | 'product'

export interface BannerFilters {
  deviceType?: DeviceType
  isActive?: boolean
  page?: number
  limit?: number | 'all'
}

export interface CreateBannerData {
  title: string
  description?: string
  image_url: string
  mobile_image_url?: string
  link_url?: string
  link_target?: LinkTarget
  device_type: DeviceType
  display_order?: number
  is_active?: boolean
  start_at?: string | null
  end_at?: string | null
}

export interface UpdateBannerData {
  title?: string
  description?: string
  image_url?: string
  mobile_image_url?: string
  link_url?: string
  link_target?: LinkTarget
  device_type?: DeviceType
  display_order?: number
  is_active?: boolean
  start_at?: string | null
  end_at?: string | null
}

export interface BannerListResponse<T> {
  banners: T[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export type MainBannerListResponse = BannerListResponse<MainBanner>
export type ProductBannerListResponse = BannerListResponse<ProductBanner>
