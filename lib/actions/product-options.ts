'use server'

import { productOptionsRepository } from '@/repositories/product-options.repository'

export async function fetchProductConfiguration(productId: string) {
  return productOptionsRepository.findConfigurationByProductId(productId)
}
