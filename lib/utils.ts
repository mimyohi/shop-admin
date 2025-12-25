import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * UTC ISO 문자열을 datetime-local 형식으로 변환 (한국 시간 기준)
 * @param isoString - UTC ISO 문자열 (예: "2025-12-19T22:49:00+00:00")
 * @returns datetime-local 형식 문자열 (예: "2025-12-20T07:49")
 */
export function utcToDatetimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  // 한국 시간으로 변환 (UTC + 9시간)
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().slice(0, 16);
}

/**
 * datetime-local 값을 KST ISO 문자열로 변환
 * @param datetimeLocalValue - datetime-local 형식 문자열 (예: "2025-12-20T07:49")
 * @returns KST ISO 문자열 (예: "2025-12-20T07:49:00+09:00") 또는 null
 */
export function datetimeLocalToKST(datetimeLocalValue: string): string | null {
  if (!datetimeLocalValue) return null;
  return `${datetimeLocalValue}:00+09:00`;
}
