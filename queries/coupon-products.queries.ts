import { queryOptions } from '@tanstack/react-query'
import { couponsRepository } from '@/repositories/coupons.repository'

export const couponProductsQueries = {
  byCouponId: (couponId: string) =>
    queryOptions({
      queryKey: ['admin-couponProducts', couponId] as const,
      queryFn: () => couponsRepository.findAssignedProductIds(couponId),
      enabled: !!couponId,
    }),
}
