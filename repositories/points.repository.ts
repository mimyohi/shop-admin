import { supabase } from '@/lib/supabase'
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
}
