import { createClient } from '@supabase/supabase-js'
import { env } from '@/env'

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
// 관리자 대시보드는 service_role 키를 사용하여 RLS 우회
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
