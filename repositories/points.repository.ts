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

    return (data as any) || []
  },

  async addPoints(userId: string, points: number, reason: string): Promise<void> {
    // add_points RPC 함수가 포인트 히스토리 추가 및 포인트 업데이트를 모두 처리
    const { error } = await supabase.rpc('add_points', {
      p_user_id: userId,
      p_points: points,
      p_reason: reason,
    })

    if (error) {
      console.error('Error adding points:', error)
      throw new Error('Failed to add points')
    }
  },

  async usePoints(userId: string, points: number, reason: string): Promise<boolean> {
    // use_points RPC 함수 사용
    const { data, error } = await supabase.rpc('use_points', {
      p_user_id: userId,
      p_points: points,
      p_reason: reason,
    })

    if (error) {
      console.error('Error using points:', error)
      throw new Error('Failed to use points')
    }

    // RPC 함수가 boolean을 반환 (포인트 부족 시 false)
    return data as boolean
  },
}
