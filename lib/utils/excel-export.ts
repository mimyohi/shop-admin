import * as XLSX from "xlsx";
import { Order, OrderItem } from "@/models/order.model";
import { formatPhoneNumberWithHyphen } from "./phone";

export interface ShippingExcelRow {
  주문일: string;
  주문자: string;
  주문자연락처: string;
  수령자: string;
  수령자연락처: string;
  우편번호: string;
  통합주소: string;
  배송메세지: string;
  상품명: string;
  옵션: string;
  내품수량: number;
  비고: string;
  발송방식: string;
  주문번호: string;
  주문상세번호: string;
}

export interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

/**
 * 주문 데이터를 배송 엑셀 양식으로 변환
 * 각 주문 항목(order_item)별로 한 행씩 생성
 */
export function convertOrdersToShippingExcel(
  orders: OrderWithItems[]
): ShippingExcelRow[] {
  const rows: ShippingExcelRow[] = [];

  for (const order of orders) {
    const orderDate = new Date(order.created_at).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const fullAddress = [order.shipping_address, order.shipping_address_detail]
      .filter(Boolean)
      .join(" ");

    const orderItems = order.order_items || [];

    if (orderItems.length === 0) {
      // 주문 항목이 없는 경우 주문 정보만 출력
      rows.push({
        주문일: orderDate,
        주문자: order.user_name || "",
        주문자연락처: formatPhoneNumberWithHyphen(order.user_phone),
        수령자: order.shipping_name || "",
        수령자연락처: formatPhoneNumberWithHyphen(order.shipping_phone),
        우편번호: order.shipping_postal_code || "",
        통합주소: fullAddress,
        배송메세지: order.shipping_message || "",
        상품명: "",
        옵션: "",
        내품수량: 0,
        비고: "",
        발송방식: "택배",
        주문번호: order.order_id || "",
        주문상세번호: "",
      });
    } else {
      // 각 주문 항목별로 행 생성
      for (const item of orderItems) {
        // 옵션명 + 선택된 타입들 조합
        let optionDisplay = item.option_name || "";
        if (item.selected_option_settings && item.selected_option_settings.length > 0) {
          const typeNames = item.selected_option_settings
            .map((s) => s.type_name)
            .filter(Boolean);
          if (typeNames.length > 0) {
            optionDisplay += ` (${typeNames.join("+")})`;
          }
        }

        // 본 상품 행 추가
        rows.push({
          주문일: orderDate,
          주문자: order.user_name || "",
          주문자연락처: formatPhoneNumberWithHyphen(order.user_phone),
          수령자: order.shipping_name || "",
          수령자연락처: formatPhoneNumberWithHyphen(order.shipping_phone),
          우편번호: order.shipping_postal_code || "",
          통합주소: fullAddress,
          배송메세지: order.shipping_message || "",
          상품명: item.product_name || "",
          옵션: optionDisplay,
          내품수량: item.quantity || 0,
          비고: "",
          발송방식: "택배",
          주문번호: order.order_id || "",
          주문상세번호: item.id || "",
        });

        // 추가 상품(addons)이 있는 경우 각각 별도 행으로 추가
        if (item.selected_addons && item.selected_addons.length > 0) {
          for (const addon of item.selected_addons) {
            rows.push({
              주문일: orderDate,
              주문자: order.user_name || "",
              주문자연락처: formatPhoneNumberWithHyphen(order.user_phone),
              수령자: order.shipping_name || "",
              수령자연락처: formatPhoneNumberWithHyphen(order.shipping_phone),
              우편번호: order.shipping_postal_code || "",
              통합주소: fullAddress,
              배송메세지: order.shipping_message || "",
              상품명: `[추가] ${addon.name}`,
              옵션: "",
              내품수량: addon.quantity || 1,
              비고: "",
              발송방식: "택배",
              주문번호: order.order_id || "",
              주문상세번호: item.id || "",
            });
          }
        }
      }
    }
  }

  return rows;
}

/**
 * 배송 데이터를 엑셀 파일로 생성하여 base64로 반환
 */
export function generateShippingExcel(orders: OrderWithItems[]): string {
  const data = convertOrdersToShippingExcel(orders);

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "배송목록");

  // 컬럼 너비 설정
  worksheet["!cols"] = [
    { wch: 12 }, // 주문일
    { wch: 10 }, // 주문자
    { wch: 15 }, // 주문자연락처
    { wch: 10 }, // 수령자
    { wch: 15 }, // 수령자연락처
    { wch: 8 }, // 우편번호
    { wch: 50 }, // 통합주소
    { wch: 30 }, // 배송메세지
    { wch: 20 }, // 상품명
    { wch: 15 }, // 옵션
    { wch: 10 }, // 내품수량
    { wch: 20 }, // 비고
    { wch: 10 }, // 발송방식
    { wch: 20 }, // 주문번호
    { wch: 36 }, // 주문상세번호
  ];

  // base64로 변환
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "base64",
  });

  return excelBuffer;
}
