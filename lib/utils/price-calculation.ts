/**
 * 가격 계산 유틸리티 함수
 *
 * order_items, 옵션, 애드온 등의 가격을 정확하게 계산합니다.
 */

export interface OrderItemForCalculation {
  product_price: number;
  quantity: number;
  selected_options?: any;
  selected_addons?: any;
}

// 최대 주문 금액 (100억원)
const MAX_ORDER_AMOUNT = 10_000_000_000;

/**
 * 숫자를 안전하게 검증하고 반환합니다
 */
function validateNumber(value: unknown, defaultValue = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return defaultValue;
  }
  return value;
}

/**
 * 가격이 유효한지 검증합니다 (음수가 아니어야 함)
 */
function validatePrice(price: number): number {
  const validated = validateNumber(price, 0);
  return validated < 0 ? 0 : validated;
}

/**
 * 수량이 유효한지 검증합니다 (1 이상이어야 함)
 */
function validateQuantity(quantity: number): number {
  const validated = validateNumber(quantity, 1);
  return validated < 1 ? 1 : Math.floor(validated);
}

/**
 * 금액을 정수로 반올림합니다 (소수점 오류 방지)
 */
function roundToInteger(amount: number): number {
  return Math.round(amount);
}

/**
 * 단일 주문 항목의 총 가격을 계산합니다
 * (상품 가격 + 옵션 추가 비용 + 애드온 가격) * 수량
 */
export function calculateOrderItemPrice(item: OrderItemForCalculation): number {
  const productPrice = validatePrice(item.product_price);
  const quantity = validateQuantity(item.quantity);

  let itemTotal = productPrice * quantity;

  // 옵션 가격 추가
  if (item.selected_options) {
    const options = Array.isArray(item.selected_options)
      ? item.selected_options
      : [];
    options.forEach((option: any) => {
      if (option.price_adjustment) {
        const adjustment = validateNumber(option.price_adjustment, 0);
        // 음수 adjustment도 허용 (할인 옵션 등)
        itemTotal += adjustment * quantity;
      }
    });
  }

  // 애드온 가격 추가
  if (item.selected_addons) {
    const addons = Array.isArray(item.selected_addons)
      ? item.selected_addons
      : [];
    addons.forEach((addon: any) => {
      if (addon.price) {
        const addonPrice = validatePrice(addon.price);
        itemTotal += addonPrice * quantity;
      }
    });
  }

  // 최종 금액은 0 이상, 최대값 이하로 제한
  itemTotal = roundToInteger(itemTotal);
  return Math.max(0, Math.min(itemTotal, MAX_ORDER_AMOUNT));
}

/**
 * 여러 주문 항목의 총 상품 금액을 계산합니다
 */
export function calculateProductAmount(items: OrderItemForCalculation[]): number {
  if (!Array.isArray(items)) return 0;

  const total = items.reduce((acc, item) => {
    return acc + calculateOrderItemPrice(item);
  }, 0);

  return Math.min(total, MAX_ORDER_AMOUNT);
}

/**
 * 최종 결제 금액을 계산합니다
 * 상품 금액 + 배송비 - 쿠폰 할인 - 포인트 사용
 */
export function calculateFinalAmount(
  productAmount: number,
  shippingFee: number,
  couponDiscount: number,
  pointsUsed: number
): number {
  const validProductAmount = validatePrice(productAmount);
  const validShippingFee = validatePrice(shippingFee);
  const validCouponDiscount = validatePrice(couponDiscount);
  const validPointsUsed = validatePrice(pointsUsed);

  // 할인 금액이 상품 금액 + 배송비를 초과할 수 없음
  const maxDiscount = validProductAmount + validShippingFee;
  const totalDiscount = Math.min(validCouponDiscount + validPointsUsed, maxDiscount);

  const finalAmount = validProductAmount + validShippingFee - totalDiscount;
  return roundToInteger(Math.max(0, finalAmount));
}

/**
 * 주문 항목들로부터 최종 결제 금액을 계산합니다
 */
export function calculateFinalAmountFromItems(
  items: OrderItemForCalculation[],
  shippingFee: number,
  couponDiscount: number,
  pointsUsed: number
): number {
  const productAmount = calculateProductAmount(items);
  return calculateFinalAmount(productAmount, shippingFee, couponDiscount, pointsUsed);
}
