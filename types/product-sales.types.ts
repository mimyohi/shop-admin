export interface ProductSalesData {
  product_id: string
  product_name: string
  total_sales: number // 총 매출액
  total_quantity: number // 총 판매 수량
  order_count: number // 주문 건수
}

export interface ProductSalesFilters {
  startDate?: string
  endDate?: string
}
