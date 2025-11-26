"use server"

import { productSalesRepository } from "@/repositories/product-sales.repository"
import { ProductSalesFilters } from "@/types/product-sales.types"

export async function fetchProductSales(filters: ProductSalesFilters = {}) {
  return await productSalesRepository.getProductSales(filters)
}
