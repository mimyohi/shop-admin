'use server'

import { pointsRepository } from '@/repositories/points.repository'
import { revalidatePath } from 'next/cache'

export async function adjustUserPoints(
  userId: string,
  points: number,
  reason: string,
  type: 'earn' | 'use'
) {
  try {
    if (type === 'earn') {
      await pointsRepository.addPoints(userId, points, reason)
    } else {
      const success = await pointsRepository.usePoints(userId, points, reason)
      if (!success) {
        return { success: false, error: '포인트가 부족합니다.' }
      }
    }

    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${userId}`)
    revalidatePath('/dashboard/points')
    return { success: true }
  } catch (error: any) {
    console.error('Adjust points error:', error)
    return { success: false, error: error.message }
  }
}
