import { supabaseServer as supabase } from '@/lib/supabase-server'
import { AdminUser } from '@/models/admin.model'

export const adminUsersRepository = {
  /**
   * 관리자 계정 목록 조회
   */
  async findMany(filters: { is_active?: boolean } = {}): Promise<AdminUser[]> {
    const { is_active } = filters

    let query = supabase.from('admin_users').select('*').order('created_at', {
      ascending: false,
    })

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching admin users:', error)
      throw new Error('Failed to fetch admin users')
    }

    return data || []
  },

  /**
   * 관리자 계정 삭제
   */
  async delete(id: string) {
    const { error } = await supabase.from('admin_users').delete().eq('id', id)

    if (error) {
      console.error('Error deleting admin user:', error)
      throw new Error('Failed to delete admin user')
    }
  },

  /**
   * 관리자 비밀번호 재설정
   */
  async resetPassword(
    masterAdminId: string,
    targetAdminId: string,
    newPassword: string
  ): Promise<void> {
    const response = await fetch('/api/admins/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        masterAdminId,
        targetAdminId,
        newPassword,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to reset password')
    }

    return
  },
}
