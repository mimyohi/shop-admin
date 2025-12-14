// 빌드 타임인지 확인
const isBuildTime =
  process.env.NODE_ENV === "production" && !process.env.NEXT_RUNTIME;

// 필수 환경 변수 검증 함수
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value && !isBuildTime) {
    console.warn(`경고: 환경 변수 ${name}이(가) 설정되지 않았습니다.`);
  }
  return value || "";
}

// 서버 사이드에서만 필수인 환경 변수 검증
function getServerRequiredEnvVar(name: string): string {
  // 클라이언트에서는 빈 문자열 반환 (서버에서만 사용되는 환경 변수)
  if (typeof window !== "undefined") {
    return "";
  }
  const value = process.env[name];
  if (!value && !isBuildTime) {
    console.warn(`경고: 서버 환경 변수 ${name}이(가) 설정되지 않았습니다.`);
  }
  return value || "";
}

export const SOLAPI_API_KEY = getServerRequiredEnvVar("SOLAPI_API_KEY");
export const SOLAPI_API_SECRET = getServerRequiredEnvVar("SOLAPI_API_SECRET");
export const KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY;
export const KAKAO_TEMPLATE_OTP = process.env.KAKAO_TEMPLATE_OTP ?? "otp_auth";
export const KAKAO_TEMPLATE_ORDER_CONFIRM =
  process.env.KAKAO_TEMPLATE_ORDER_CONFIRM ?? "order_confirmation";
export const KAKAO_TEMPLATE_SHIPPING =
  process.env.KAKAO_TEMPLATE_SHIPPING ?? "shipping_notification";
export const KAKAO_TEMPLATE_CANCEL =
  process.env.KAKAO_TEMPLATE_CANCEL ?? "order_cancellation";

export const NEXT_PUBLIC_SUPABASE_URL = getRequiredEnvVar(
  "NEXT_PUBLIC_SUPABASE_URL"
);
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = getRequiredEnvVar(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const PORTONE_API_SECRET = getServerRequiredEnvVar("PORTONE_API_SECRET");

export const NODE_ENV = process.env.NODE_ENV ?? "development";

type Env = {
  readonly SOLAPI_API_KEY: string;
  readonly SOLAPI_API_SECRET: string;
  readonly KAKAO_SENDER_KEY?: string;
  readonly KAKAO_TEMPLATE_OTP: string;
  readonly KAKAO_TEMPLATE_ORDER_CONFIRM: string;
  readonly KAKAO_TEMPLATE_SHIPPING: string;
  readonly KAKAO_TEMPLATE_CANCEL: string;
  readonly NEXT_PUBLIC_SUPABASE_URL: string;
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly PORTONE_API_SECRET: string;
  readonly NODE_ENV: string;
};

export const env: Env = {
  SOLAPI_API_KEY,
  SOLAPI_API_SECRET,
  KAKAO_SENDER_KEY,
  KAKAO_TEMPLATE_OTP,
  KAKAO_TEMPLATE_ORDER_CONFIRM,
  KAKAO_TEMPLATE_SHIPPING,
  KAKAO_TEMPLATE_CANCEL,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  PORTONE_API_SECRET,
  NODE_ENV,
};
