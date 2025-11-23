'use server'

import { pointsRepository } from '@/repositories/points.repository'

export async function fetchPointHistory(userId: string, limit = 50) {
  return pointsRepository.findHistoryByUserId(userId, limit)
}
