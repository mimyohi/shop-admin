export interface ProductSalesData {
  product_id: string
  product_name: string
  total_sales: number // 총 매출액 (기본가 + 옵션 + 추가상품)
  base_sales: number // 기본 상품 매출
  option_sales: number // 옵션 매출
  addon_sales: number // 추가상품 매출
  total_quantity: number // 총 판매 수량
  order_count: number // 주문 건수
  option_breakdown?: OptionSalesBreakdown[] // 옵션별 매출 상세
  addon_breakdown?: AddonSalesBreakdown[] // 애드온별 매출 상세
}

export interface OptionSalesBreakdown {
  option_id: string | null // null = "옵션 없음"
  option_name: string
  sales: number // 해당 옵션의 총 매출
  quantity: number
  order_count: number
}

export interface AddonSalesBreakdown {
  addon_id: string
  addon_name: string
  sales: number // 해당 애드온의 총 매출
  quantity: number // 애드온이 선택된 총 횟수
  order_count: number // 애드온이 포함된 주문 건수
}

export interface ProductSalesFilters {
  startDate?: string
  endDate?: string
}
