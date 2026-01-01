/**
 * 전화번호 포맷팅 유틸리티
 */

/**
 * 전화번호를 010 형식으로 포맷팅
 * +82, 82, 010 등 다양한 형식을 010으로 통일
 *
 * @param phone - 원본 전화번호
 * @returns 010으로 시작하는 한국 전화번호 형식
 *
 * @example
 * formatPhoneNumber("+821012345678") // "01012345678"
 * formatPhoneNumber("821012345678") // "01012345678"
 * formatPhoneNumber("010-1234-5678") // "01012345678"
 * formatPhoneNumber("1012345678") // "01012345678"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "-";

  const cleanPhone = phone.replace(/[^0-9]/g, "");

  // 82로 시작하면 0으로 변환 (8210... -> 010...)
  if (cleanPhone.startsWith("82")) {
    return `0${cleanPhone.substring(2)}`;
  }

  // 이미 0으로 시작하면 그대로 반환
  if (cleanPhone.startsWith("0")) {
    return cleanPhone;
  }

  // 10으로 시작하면 앞에 0 추가
  if (cleanPhone.startsWith("10")) {
    return `0${cleanPhone}`;
  }

  // 그 외의 경우 원본 반환
  return phone;
}

/**
 * 전화번호를 하이픈으로 구분된 형식으로 포맷팅
 *
 * @param phone - 원본 전화번호
 * @returns 010-1234-5678 형식
 *
 * @example
 * formatPhoneNumberWithHyphen("01012345678") // "010-1234-5678"
 * formatPhoneNumberWithHyphen("+821012345678") // "010-1234-5678"
 */
export function formatPhoneNumberWithHyphen(phone: string | null | undefined): string {
  const formatted = formatPhoneNumber(phone);
  if (formatted === "-") return formatted;

  // 010-1234-5678 형식으로 변환
  if (formatted.length === 11 && formatted.startsWith("010")) {
    return `${formatted.slice(0, 3)}-${formatted.slice(3, 7)}-${formatted.slice(7)}`;
  }

  // 011, 016, 017, 018, 019 등 10자리 번호
  if (formatted.length === 10 && formatted.startsWith("01")) {
    return `${formatted.slice(0, 3)}-${formatted.slice(3, 6)}-${formatted.slice(6)}`;
  }

  return formatted;
}
