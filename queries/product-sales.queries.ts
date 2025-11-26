import { queryOptions } from "@tanstack/react-query"
import { fetchProductSales } from "@/lib/actions/product-sales"
import { ProductSalesFilters } from "@/types/product-sales.types"

export const productSalesQueries = {
  list: (filters: ProductSalesFilters = {}) =>
    queryOptions({
      queryKey: ["product-sales", filters] as const,
      queryFn: () => fetchProductSales(filters),
      staleTime: 5 * 60 * 1000, // 5분
    }),
}
