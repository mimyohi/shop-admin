/**
 * Product 테이블 모델
 */
export interface Product {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  detail_images?: string[] | null;
  category?: string | null;
  is_visible_on_main?: boolean | null;
  is_out_of_stock?: boolean | null;
  is_new_badge?: boolean | null;
  is_sale_badge?: boolean | null;
  sale_start_at?: string | null;
  sale_end_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  discount_rate?: number | null;
}

/**
 * ProductAddon 테이블 모델 (추가 상품)
 */
export interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url?: string | null;
  is_available: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * 선택된 추가상품 (장바구니/주문용)
 */
export interface SelectedAddon {
  addon_id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * 장바구니 아이템 (Product용)
 */
export interface CartItem {
  product: Product;
  quantity: number;
  selected_addons?: SelectedAddon[];
}
