import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// 서버 전용 Supabase 클라이언트 (Service Role 사용)
// 이 파일은 서버 컴포넌트, API 라우트, 서버 액션에서만 import하세요

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 빌드 타임인지 확인 (빌드 타임에는 검증 건너뜀)
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME;

// 서버 런타임에서만 필수 환경 변수 검증
if (typeof window === "undefined" && !isBuildTime) {
  if (!supabaseUrl) {
    console.warn("경고: NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
  }
  if (!supabaseServiceKey) {
    console.warn(
      "경고: SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다. " +
      "서버 작업에는 Service Role Key가 필요합니다."
    );
  }
}

export const supabaseServer = createClient<Database>(
  supabaseUrl || "",
  supabaseServiceKey || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
