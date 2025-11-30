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

    return (data || []).map(user => ({
      ...user,
      role: user.role as 'admin' | 'master' | undefined,
      is_active: user.is_active ?? undefined,
      created_at: user.created_at ?? undefined,
      updated_at: user.updated_at ?? undefined,
      last_login_at: user.last_login_at ?? undefined,
      created_by: user.created_by ?? undefined,
    }))
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
}
