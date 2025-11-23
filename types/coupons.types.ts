import { Coupon } from '@/models'

export interface CouponFilters {
  search?: string
  is_active?: boolean
  page?: number
  limit?: number | 'all'
}

export interface CreateCouponData {
  code: string
  name: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase: number
  max_discount?: number
  valid_from: string
  valid_until?: string
  usage_limit?: number
  is_active?: boolean
}

export interface UpdateCouponData {
  code?: string
  name?: string
  description?: string
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  min_purchase?: number
  max_discount?: number
  valid_from?: string
  valid_until?: string
  usage_limit?: number
  is_active?: boolean
}
