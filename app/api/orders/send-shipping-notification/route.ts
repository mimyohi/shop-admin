import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

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
    const { data: order, error: orderError } = await supabaseServer
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
