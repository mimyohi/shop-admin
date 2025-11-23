import { UserProfile } from '@/models'

export interface UserFilters {
  search?: string
  phone_verified?: boolean
  page?: number
  limit?: number | 'all'
}

export interface UserWithStats extends UserProfile {
  order_count?: number
  total_spent?: number
  points?: number
  total_earned?: number
  total_used?: number
}
