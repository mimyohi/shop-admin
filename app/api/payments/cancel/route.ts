import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

const portoneApiSecret = env.PORTONE_API_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { paymentId, reason } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "결제 ID가 필요합니다." },
        { status: 400 }
      );
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
        body: JSON.stringify({
          reason: reason || "관리자 요청",
        }),
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
