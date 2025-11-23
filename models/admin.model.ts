/**
 * AdminUsers 테이블 모델
 */
export interface AdminUser {
  id: string
  username: string
  full_name?: string | null
  email?: string | null
  role?: 'admin' | 'master'
  is_active?: boolean
  created_at?: string
  updated_at?: string
  last_login_at?: string | null
}
