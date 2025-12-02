import { Product } from './product.model'

/**
 * HomeProduct 테이블 모델
 * 홈 페이지에 표시할 상품 설정
 */
export interface HomeProduct {
  id: string
  product_id: string
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * HomeProduct with Product 정보 포함
 */
export interface HomeProductWithProduct extends HomeProduct {
  product: Product
}
