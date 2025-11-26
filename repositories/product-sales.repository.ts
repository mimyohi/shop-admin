import { supabaseServer as supabase } from "@/lib/supabase-server"
import { ProductSalesData, ProductSalesFilters } from "@/types/product-sales.types"

export const productSalesRepository = {
  /**
   * 상품별 매출 집계 조회
   */
  async getProductSales(filters: ProductSalesFilters = {}): Promise<ProductSalesData[]> {
    const { startDate, endDate } = filters

    let query = supabase
      .from("order_items")
      .select(`
        product_id,
        product_name,
        product_price,
        quantity,
        orders!inner(
          id,
          status,
          created_at
        )
      `)
      .eq("orders.status", "completed")

    if (startDate) {
      query = query.gte("orders.created_at", startDate)
    }

    if (endDate) {
      query = query.lte("orders.created_at", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching product sales:", error)
      throw new Error("Failed to fetch product sales")
    }

    // 상품별로 그룹화하여 집계
    const salesMap = new Map<string, ProductSalesData>()

    data?.forEach((item: any) => {
      const productId = item.product_id
      const productName = item.product_name
      const itemTotal = item.product_price * item.quantity

      if (salesMap.has(productId)) {
        const existing = salesMap.get(productId)!
        existing.total_sales += itemTotal
        existing.total_quantity += item.quantity
        existing.order_count += 1
      } else {
        salesMap.set(productId, {
          product_id: productId,
          product_name: productName,
          total_sales: itemTotal,
          total_quantity: item.quantity,
          order_count: 1,
        })
      }
    })

    // Map을 배열로 변환하고 매출액 기준 내림차순 정렬
    return Array.from(salesMap.values()).sort((a, b) => b.total_sales - a.total_sales)
  },
}
