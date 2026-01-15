import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { supabaseServer } from "@/lib/supabase-server";
import { sendPaymentCancellationAlimtalk } from "@/lib/kakao/alimtalk";
import { restoreCouponAndPoints } from "@/lib/order-recovery";

const portoneApiSecret = env.PORTONE_API_SECRET;

// 가상계좌 환불 정보 타입
interface RefundAccount {
  bank: string;
  number: string;
  holderName: string;
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId, reason, orderId, refundAccount } = await request.json() as {
      paymentId?: string;
      reason?: string;
      orderId?: string;
      refundAccount?: RefundAccount;
    };

    if (!paymentId && !orderId) {
      return NextResponse.json(
        { error: "주문 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 결제 정보가 없는 0원 주문 취소 처리
    if (!paymentId) {
      // orderId는 위에서 검증되어 이 시점에 반드시 존재함
      const validOrderId = orderId!;

      const { data: orderData } = await supabaseServer
        .from("orders")
        .select("order_id, total_amount, user_name, user_phone")
        .eq("id", validOrderId)
        .single();

      if (orderData?.total_amount && orderData.total_amount > 0) {
        return NextResponse.json(
          { error: "결제 정보가 없어 취소할 수 없습니다." },
          { status: 400 }
        );
      }

      const recoveryResult = await restoreCouponAndPoints(supabaseServer, validOrderId);
      if (recoveryResult.success) {
        console.log(`쿠폰 복구: ${recoveryResult.couponRestored}, 포인트 복구: ${recoveryResult.pointRestored}`);
      }

      const { error: updateError } = await supabaseServer
        .from("orders")
        .update({
          status: "cancelled",
          consultation_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", validOrderId);

      if (updateError) {
        console.error("주문 상태 업데이트 실패:", updateError);
        return NextResponse.json({
          success: true,
          message: "주문은 취소되었으나 상태 업데이트에 실패했습니다.",
          warning: "주문 상태 업데이트 실패",
        });
      }

      if (orderData?.user_phone) {
        try {
          const alimtalkResult = await sendPaymentCancellationAlimtalk(
            orderData.user_phone,
            {
              orderId: orderData.order_id,
              customerName: orderData.user_name || "고객",
              totalAmount: orderData.total_amount || 0,
              cancelReason: reason,
            }
          );

          if (!alimtalkResult.success) {
            console.error("주문 취소 알림톡 발송 실패:", alimtalkResult.error);
          }
        } catch (alimtalkError) {
          console.error("주문 취소 알림톡 발송 중 오류:", alimtalkError);
        }
      }

      return NextResponse.json({
        success: true,
        message: "주문이 취소되었습니다.",
      });
    }

    // PortOne API 요청 body 구성
    const cancelRequestBody: Record<string, unknown> = {
      reason: reason || "관리자 요청",
    };

    // 가상계좌 환불인 경우 환불 계좌 정보 추가
    if (refundAccount) {
      cancelRequestBody.refundAccount = {
        bank: refundAccount.bank,
        number: refundAccount.number,
        holderName: refundAccount.holderName,
      };
      console.log("가상계좌 환불 요청:", {
        bank: refundAccount.bank,
        number: refundAccount.number.slice(0, 4) + "****", // 계좌번호 마스킹
        holderName: refundAccount.holderName,
      });
    }

    // PortOne API로 결제 취소 요청
    const response = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `PortOne ${portoneApiSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cancelRequestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("결제 취소 실패:", data);
      return NextResponse.json(
        { error: data.message || "결제 취소에 실패했습니다." },
        { status: response.status }
      );
    }

    // 결제 취소 성공 시 주문 상태도 업데이트
    if (orderId) {
      // 쿠폰 및 포인트 복구
      const recoveryResult = await restoreCouponAndPoints(supabaseServer, orderId);
      if (recoveryResult.success) {
        console.log(`쿠폰 복구: ${recoveryResult.couponRestored}, 포인트 복구: ${recoveryResult.pointRestored}`);
      }

      // 주문 정보 조회 (알림톡 발송을 위해)
      const { data: orderData } = await supabaseServer
        .from("orders")
        .select("order_id, total_amount, user_name, user_phone")
        .eq("id", orderId)
        .single();

      const { error: updateError } = await supabaseServer
        .from("orders")
        .update({
          status: "cancelled",
          consultation_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("주문 상태 업데이트 실패:", updateError);
        // 결제 취소는 성공했으므로 경고만 반환
        return NextResponse.json({
          success: true,
          message: "결제는 취소되었으나 주문 상태 업데이트에 실패했습니다.",
          data,
          warning: "주문 상태 업데이트 실패",
        });
      }
      console.log("orderData?.user_phone:", orderData?.user_phone);
      // 주문 취소 알림톡 발송
      if (orderData?.user_phone) {
        try {
          const alimtalkResult = await sendPaymentCancellationAlimtalk(
            orderData.user_phone,
            {
              orderId: orderData.order_id,
              customerName: orderData.user_name || "고객",
              totalAmount: orderData.total_amount || 0,
              cancelReason: reason,
            }
          );

          if (!alimtalkResult.success) {
            console.error("주문 취소 알림톡 발송 실패:", alimtalkResult.error);
          }
        } catch (alimtalkError) {
          console.error("주문 취소 알림톡 발송 중 오류:", alimtalkError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "결제가 취소되었습니다.",
      data,
    });
  } catch (error) {
    console.error("결제 취소 중 오류:", error);
    return NextResponse.json(
      { error: "결제 취소 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
