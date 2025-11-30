import { supabaseServer as supabase } from '@/lib/supabase-server'
import { UserFilters, UserWithStats } from '@/types/users.types'

export const usersRepository = {
  /**
   * 사용자 목록 조회 (관리자용)
   */
  async findMany(filters: UserFilters = {}) {
    const { search, phone_verified, page = 1, limit = 20 } = filters

    const shouldPaginate = limit !== 'all'
    const numericLimit = typeof limit === 'number' ? limit : undefined
    const from = shouldPaginate ? (page - 1) * (numericLimit as number) : undefined
    const to = shouldPaginate && numericLimit ? from! + numericLimit - 1 : undefined

    let query = supabase.from('user_profiles').select('*', { count: 'exact' })

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,display_name.ilike.%${search}%,phone.ilike.%${search}%`
      )
    }

    if (phone_verified !== undefined) {
      query = query.eq('phone_verified', phone_verified)
    }

    query = query.order('created_at', { ascending: false })

    if (shouldPaginate && typeof from === 'number' && typeof to === 'number') {
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users')
    }

    // 각 사용자의 통계 정보 가져오기
    const usersWithStats = await Promise.all(
      (data || []).map(async (user) => {
        // 주문 수와 총 구매액
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('user_email', user.email)
          .eq('status', 'completed')

        const orderCount = orders?.length || 0
        const totalSpent =
          orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0

        // 포인트
        let points = 0
        if (user.user_id) {
          const { data: pointsData } = await supabase
            .from('user_points')
            .select('points')
            .eq('user_id', user.user_id)
            .single()
          points = pointsData?.points || 0
        }

        return {
          ...user,
          order_count: orderCount,
          total_spent: totalSpent,
          points,
        } as UserWithStats
      })
    )

    const totalCount =
      shouldPaginate && typeof count === 'number'
        ? count
        : count ?? usersWithStats.length ?? 0

    return {
      users: usersWithStats,
      totalCount,
      totalPages:
        shouldPaginate && numericLimit
          ? Math.ceil(totalCount / numericLimit)
          : 1,
      currentPage: shouldPaginate ? page : 1,
    }
  },

  /**
   * 사용자 상세 조회
   */
  async findById(userId: string): Promise<UserWithStats | null> {
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !user) {
      return null
    }

    // 주문 수와 총 구매액
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('user_email', user.email)
      .eq('status', 'completed')

    const orderCount = orders?.length || 0
    const totalSpent =
      orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0

    // 포인트
    let points = 0
    if (user.user_id) {
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.user_id)
        .single()
      points = pointsData?.points || 0
    }

    return {
      ...user,
      order_count: orderCount,
      total_spent: totalSpent,
      points,
    } as UserWithStats
  },

  /**
   * 대시보드 통계
   */
  async getStats() {
    // 총 사용자 수
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    // 오늘 가입한 사용자 수
    const today = new Date()
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()

    const { count: todayUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart)

    // 전화번호 인증 완료 사용자 수
    const { count: verifiedUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('phone_verified', true)

    return {
      totalUsers: totalUsers || 0,
      todayUsers: todayUsers || 0,
      verifiedUsers: verifiedUsers || 0,
    }
  },

  /**
   * 사용자 프로필 업데이트
   */
  async updateProfile(userId: string, data: Partial<{
    display_name: string
    phone: string
    email: string
  }>) {
    const { data: result, error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      throw new Error('Failed to update user profile')
    }

    return result
  },

  /**
   * 전화번호 인증
   */
  async verifyPhone(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error verifying phone:', error)
      throw new Error('Failed to verify phone')
    }

    return data
  },

  /**
   * 사용자 삭제
   */
  async delete(userId: string) {
    // user_profiles 삭제 (CASCADE로 관련 데이터도 삭제됨)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      throw new Error('Failed to delete user')
    }

    // auth.users도 삭제 (admin API 필요)
    // 참고: 이 작업은 Supabase Admin API를 사용해야 하므로
    // 실제 구현 시 별도의 엔드포인트가 필요할 수 있습니다
  },
}
