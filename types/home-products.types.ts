import { HomeProductWithProduct } from '@/models'

export interface HomeProductsListResponse {
  homeProducts: HomeProductWithProduct[]
  total: number
}

export interface SetHomeProductsData {
  productIds: string[]
}
