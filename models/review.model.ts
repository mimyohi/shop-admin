/**
 * Reviews 테이블 모델
 */
export interface Review {
  id: string
  product_id: string
  user_email: string
  user_name: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
}
