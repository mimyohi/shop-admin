/**
 * Email Service for shop-admin
 * Uses Resend for email delivery
 */

import { env } from "@/env";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  const resendApiKey = env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to send email:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export function getShippingNotificationEmail(orderData: {
  orderId: string;
  customerName: string;
  shippingCompany: string;
  trackingNumber: string;
  shippingAddress?: string;
  shippingAddressDetail?: string;
  shippingPostalCode?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>배송 시작 안내</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); padding: 32px;">
      <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #111827;">상품이 발송되었습니다</h1>

      <p style="margin: 0 0 16px 0; color: #6b7280;">
        안녕하세요, ${orderData.customerName}님
      </p>

      <p style="margin: 0 0 24px 0; color: #6b7280;">
        주문하신 상품이 발송되었습니다.
      </p>

      <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">주문번호</p>
        <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">${orderData.orderId}</p>

        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">택배사</p>
        <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">${orderData.shippingCompany}</p>

        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">송장번호</p>
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${orderData.trackingNumber}</p>
      </div>

      ${
        orderData.shippingAddress
          ? `
      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">배송지 정보</h2>
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; color: #111827;">
          [${orderData.shippingPostalCode}] ${orderData.shippingAddress}
        </p>
        <p style="margin: 0; color: #6b7280;">
          ${orderData.shippingAddressDetail || ""}
        </p>
      </div>
      `
          : ""
      }

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
          배송 조회는 택배사 웹사이트에서 송장번호로 확인하실 수 있습니다.
        </p>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          문의사항이 있으시면 고객센터로 연락 주시기 바랍니다.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
