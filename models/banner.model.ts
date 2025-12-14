/**
 * Banner models
 */

export type DeviceType = 'pc' | 'mobile' | 'both'
export type LinkTarget = '_self' | '_blank'

export interface MainBanner {
  id: string
  image_url: string
  mobile_image_url: string | null
  device_type: DeviceType
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductBanner {
  id: string
  image_url: string
  mobile_image_url: string | null
  link_url: string | null
  link_target: LinkTarget
  device_type: DeviceType
  display_order: number
  is_active: boolean
  start_at: string | null
  end_at: string | null
  created_at: string
  updated_at: string
}
