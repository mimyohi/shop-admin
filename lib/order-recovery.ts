import { SupabaseClient } from "@supabase/supabase-js";

/**
 * 주문 취소 시 쿠폰과 포인트를 복구하는 공통 함수
 */
export async function restoreCouponAndPoints(
  supabase: SupabaseClient,
  orderId: string
): Promise<{
  success: boolean;
  couponRestored: boolean;
  pointRestored: boolean;
  error?: string;
}> {
  try {
    const now = new Date().toISOString();

    // 1. 주문 정보 조회
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_id, user_id, user_coupon_id, used_points")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return {
        success: false,
        couponRestored: false,
        pointRestored: false,
        error: "주문을 찾을 수 없습니다.",
      };
    }

    let couponRestored = false;
    let pointRestored = false;

    // 2. 쿠폰 복구
    if (order.user_coupon_id) {
      const { error: couponError } = await supabase
        .from("user_coupons")
        .update({
          is_used: false,
          used_at: null,
          order_id: null,
          updated_at: now,
        })
        .eq("id", order.user_coupon_id);

      if (couponError) {
        console.error(`쿠폰 복구 실패 (주문: ${order.order_id}):`, couponError);
      } else {
        couponRestored = true;
      }
    }

    // 3. 포인트 복구
    if (order.used_points && order.used_points > 0 && order.user_id) {
      // 현재 포인트 조회
      const { data: currentPoints } = await supabase
        .from("user_points")
        .select("points, total_used")
        .eq("user_id", order.user_id)
        .single();

      if (currentPoints) {
        // user_points 업데이트
        const { error: pointsError } = await supabase
          .from("user_points")
          .update({
            points: currentPoints.points + order.used_points,
            total_used: Math.max(0, currentPoints.total_used - order.used_points),
            updated_at: now,
          })
          .eq("user_id", order.user_id);

        if (pointsError) {
          console.error(`포인트 복구 실패 (주문: ${order.order_id}):`, pointsError);
        } else {
          // point_history에 복구 기록 추가
          await supabase.from("point_history").insert({
            user_id: order.user_id,
            points: order.used_points,
            type: "earn",
            reason: `주문 취소로 인한 포인트 복구 (${order.order_id})`,
            order_id: order.id,
          });
          pointRestored = true;
        }
      }
    }

    return {
      success: true,
      couponRestored,
      pointRestored,
    };
  } catch (error) {
    console.error("쿠폰/포인트 복구 중 오류:", error);
    return {
      success: false,
      couponRestored: false,
      pointRestored: false,
      error: "복구 중 오류가 발생했습니다.",
    };
  }
}
