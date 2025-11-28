/**
 * Product 테이블 모델
 */
export interface Product {
  id: string;
  slug?: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  detail_images?: string[];
  category: string;
  is_visible_on_main?: boolean;
  is_out_of_stock?: boolean;
  sale_start_at?: string | null;
  sale_end_at?: string | null;
  average_rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
  discount_rate: string;
}

/**
 * 조건부 옵션 표시 설정
 */
export interface VisibilityCondition {
  parent_values: string[]; // Parent option value IDs
  action: "show" | "hide"; // Show or hide when parent values are selected
}

/**
 * 자식 옵션 영향 설정
 */
export interface ChildOptionConfig {
  target_option_id: string; // Which child option to affect
  show_value_ids: string[]; // Which values to show for that option
}

/**
 * ProductOption 테이블 모델 (상품 옵션)
 */
export interface ProductOption {
  id: string;
  product_id: string;
  name: string; // e.g., "사이즈", "색상"
  is_required: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  parent_option_id?: string | null; // Parent option for conditional display
  visibility_conditions?: VisibilityCondition | null; // Conditions for visibility
  values?: ProductOptionValue[]; // Joined data
}

/**
 * ProductOptionValue 테이블 모델 (옵션 값)
 */
export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string; // e.g., "Small", "Medium", "Large"
  price_adjustment: number; // Additional price (can be negative)
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  affects_child_options?: ChildOptionConfig[] | null; // Child option configurations
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
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * 선택된 옵션 (장바구니/주문용)
 */
export interface SelectedOption {
  option_id: string;
  option_name: string;
  value_id: string;
  value: string;
  price_adjustment: number;
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
 * 장바구니 아이템 (클라이언트용)
 */
export interface CartItem {
  product: Product;
  quantity: number;
  selected_options?: SelectedOption[];
  selected_addons?: SelectedAddon[];
}
