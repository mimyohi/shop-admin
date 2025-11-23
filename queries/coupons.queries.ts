import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCoupon as createCouponAction,
  deleteCoupon as deleteCouponAction,
  fetchCoupon,
  fetchCoupons,
  toggleCouponActive as toggleCouponActiveAction,
  updateCoupon as updateCouponAction,
} from "@/lib/actions/coupons";
import {
  CouponFilters,
  CreateCouponData,
  UpdateCouponData,
} from "@/types/coupons.types";

export type {
  CouponFilters,
  CreateCouponData,
  UpdateCouponData,
} from "@/types/coupons.types";

export const couponsQueries = {
  all: () => ["admin-coupons"] as const,

  lists: () => [...couponsQueries.all(), "list"] as const,

  list: (filters: CouponFilters = {}) =>
    queryOptions({
      queryKey: [...couponsQueries.lists(), filters] as const,
      queryFn: () => fetchCoupons(filters),
    }),

  details: () => [...couponsQueries.all(), "detail"] as const,

  detail: (id: string) =>
    queryOptions({
      queryKey: [...couponsQueries.details(), id] as const,
      queryFn: () => fetchCoupon(id),
      enabled: !!id,
    }),
};

/**
 * 쿠폰 생성 mutation
 */
export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (couponData: CreateCouponData) =>
      createCouponAction(couponData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponsQueries.lists() });
    },
  });
}

/**
 * 쿠폰 수정 mutation
 */
export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponData }) =>
      updateCouponAction(id, data),
    onSuccess: (updatedCoupon) => {
      queryClient.invalidateQueries({ queryKey: couponsQueries.lists() });
      queryClient.invalidateQueries({
        queryKey: couponsQueries.detail(updatedCoupon.id).queryKey,
      });
    },
  });
}

/**
 * 쿠폰 삭제 mutation
 */
export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCouponAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponsQueries.lists() });
    },
  });
}

/**
 * 쿠폰 활성화/비활성화 mutation
 */
export function useToggleCouponActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCouponActiveAction(id, isActive),
    onSuccess: (updatedCoupon) => {
      queryClient.invalidateQueries({ queryKey: couponsQueries.lists() });
      queryClient.invalidateQueries({
        queryKey: couponsQueries.detail(updatedCoupon.id).queryKey,
      });
    },
  });
}
