'use server'

import { homeProductsRepository } from '@/repositories/home-products.repository'
import { HomeProductWithProduct, Product } from '@/models'

/**
 * 홈 상품 목록 조회
 */
export async function fetchHomeProducts(): Promise<HomeProductWithProduct[]> {
  return homeProductsRepository.findAll()
}

/**
 * 모든 상품 목록 조회 (선택용)
 */
export async function fetchAllProducts(): Promise<Product[]> {
  return homeProductsRepository.getAllProducts()
}

/**
 * 홈 상품 설정 (전체 교체)
 */
export async function setHomeProducts(productIds: string[]): Promise<HomeProductWithProduct[]> {
  return homeProductsRepository.setHomeProducts(productIds)
}

/**
 * 홈 상품 순서 변경
 */
export async function updateHomeProductOrder(
  orderUpdates: { id: string; display_order: number }[]
): Promise<void> {
  return homeProductsRepository.updateOrder(orderUpdates)
}

/**
 * 홈 상품 삭제
 */
export async function removeHomeProduct(id: string): Promise<void> {
  return homeProductsRepository.remove(id)
}

/**
 * 홈 상품 추가
 */
export async function addHomeProduct(productId: string): Promise<HomeProductWithProduct[]> {
  return homeProductsRepository.add(productId)
}
