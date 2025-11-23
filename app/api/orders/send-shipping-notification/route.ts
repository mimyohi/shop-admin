import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendShippingNotificationAlimtalk } from "@/lib/kakao/alimtalk";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "주문 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 주문 정보 조회
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("주문 조회 실패:", orderError);
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 배송 정보 확인
    if (!order.shipping_company || !order.tracking_number) {
      return NextResponse.json(
        { error: "배송 정보가 완료되지 않았습니다." },
        { status: 400 }
      );
    }

    // 전화번호 확인
    const phone = order.user_phone || order.shipping_phone;
    if (!phone) {
      return NextResponse.json(
        { error: "수신자 전화번호가 없습니다." },
        { status: 400 }
      );
    }

    // 알림톡 발송
    const result = await sendShippingNotificationAlimtalk(phone, {
      orderId: order.order_id,
      customerName: order.user_name || order.shipping_name,
      shippingCompany: order.shipping_company,
      trackingNumber: order.tracking_number,
    });

    if (!result.success) {
      console.error("알림톡 발송 실패:", result.error);
      return NextResponse.json(
        { error: "알림톡 발송에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "배송 알림톡이 발송되었습니다.",
    });
  } catch (error) {
    console.error("배송 알림 발송 중 오류:", error);
    return NextResponse.json(
      { error: "배송 알림 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
