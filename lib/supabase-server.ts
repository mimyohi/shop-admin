import { createClient } from '@supabase/supabase-js'

// 서버 전용 Supabase 클라이언트 (Service Role 사용)
// 이 파일은 서버 컴포넌트, API 라우트, 서버 액션에서만 import하세요

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey && typeof window === 'undefined') {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is not set! Server-side operations may fail.')
  console.warn('⚠️  Please add SUPABASE_SERVICE_ROLE_KEY to your .env file and restart the server.')
}

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
