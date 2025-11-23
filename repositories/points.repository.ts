import { supabaseServer as supabase } from '@/lib/supabase-server'
import type { PointHistory } from '@/models'

export const pointsRepository = {
  async findHistoryByUserId(userId: string, limit = 50): Promise<PointHistory[]> {
    const { data, error } = await supabase
      .from('point_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching point history:', error)
      throw new Error('Failed to fetch point history')
    }

    return data || []
  },

  async addPoints(userId: string, points: number, reason: string): Promise<void> {
    // 포인트 히스토리 추가
    const { error: historyError } = await supabase
      .from('point_history')
      .insert({
        user_id: userId,
        points,
        reason,
        type: 'earn',
        created_at: new Date().toISOString(),
      })

    if (historyError) {
      console.error('Error adding point history:', historyError)
      throw new Error('Failed to add point history')
    }

    // 유저의 총 포인트 업데이트
    const { error: updateError } = await supabase.rpc('increment_user_points', {
      p_user_id: userId,
      p_points: points,
    })

    if (updateError) {
      console.error('Error updating user points:', updateError)
      throw new Error('Failed to update user points')
    }
  },

  async usePoints(userId: string, points: number, reason: string): Promise<boolean> {
    // 유저의 현재 포인트 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user points:', userError)
      throw new Error('Failed to fetch user points')
    }

    // 포인트가 충분한지 확인
    if ((user.points || 0) < points) {
      return false
    }

    // 포인트 히스토리 추가
    const { error: historyError } = await supabase
      .from('point_history')
      .insert({
        user_id: userId,
        points: -points,
        reason,
        type: 'use',
        created_at: new Date().toISOString(),
      })

    if (historyError) {
      console.error('Error adding point history:', historyError)
      throw new Error('Failed to add point history')
    }

    // 유저의 총 포인트 업데이트
    const { error: updateError } = await supabase.rpc('increment_user_points', {
      p_user_id: userId,
      p_points: -points,
    })

    if (updateError) {
      console.error('Error updating user points:', updateError)
      throw new Error('Failed to update user points')
    }

    return true
  },
}
