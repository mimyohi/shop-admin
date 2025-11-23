import { queryOptions } from '@tanstack/react-query'
import { fetchCouponProductIds } from '@/lib/actions/coupons'

export const couponProductsQueries = {
  byCouponId: (couponId: string) =>
    queryOptions({
      queryKey: ['admin-couponProducts', couponId] as const,
      queryFn: () => fetchCouponProductIds(couponId),
      enabled: !!couponId,
    }),
}
