import { MainBanner, ProductBanner, DeviceType, LinkTarget } from '@/models'

export type BannerType = 'main' | 'product'

export interface BannerFilters {
  deviceType?: DeviceType
  isActive?: boolean
  page?: number
  limit?: number | 'all'
}

// 메인 배너 - 이미지만 (링크, 기간, 제목/설명 없음)
export interface CreateMainBannerData {
  image_url: string
  mobile_image_url?: string
  device_type: DeviceType
  display_order?: number
  is_active?: boolean
}

export interface UpdateMainBannerData {
  image_url?: string
  mobile_image_url?: string
  device_type?: DeviceType
  display_order?: number
  is_active?: boolean
}

// 상품 배너 - 링크와 기간 있음 (제목/설명 없음)
export interface CreateProductBannerData {
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

export interface UpdateProductBannerData {
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

// 레거시 호환 (deprecated)
export type CreateBannerData = CreateProductBannerData
export type UpdateBannerData = UpdateProductBannerData

export interface BannerListResponse<T> {
  banners: T[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export type MainBannerListResponse = BannerListResponse<MainBanner>
export type ProductBannerListResponse = BannerListResponse<ProductBanner>
