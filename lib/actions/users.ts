'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { usersRepository } from '@/repositories/users.repository'
import { UserFilters } from '@/types/users.types'

export async function fetchUsers(filters: UserFilters = {}) {
  return usersRepository.findMany(filters)
}

export async function fetchUser(userId: string) {
  return usersRepository.findById(userId)
}

export async function fetchUserStats() {
  return usersRepository.getStats()
}

export async function fetchUserProfileWithPoints(userId: string) {
  const { data, error } = await supabaseServer
    .from('user_profiles')
    .select(
      `
      *,
      user_points(points, total_earned, total_used)
    `
    )
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Fetch user profile with points error:', error)
    throw error
  }

  return data
}

export async function fetchUserOrderHistory(email: string) {
  const { data, error } = await supabaseServer
    .from('orders')
    .select(
      `
      id,
      order_id,
      status,
      consultation_status,
      total_amount,
      created_at,
      order_items(id, product_name, quantity)
    `
    )
    .eq('user_email', email)
    .not('status', 'in', '(pending,payment_pending)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch user order history error:', error)
    throw error
  }

  return data || []
}

export async function updateUserProfile(userId: string, data: any) {
  const result = await usersRepository.updateProfile(userId, data)
  revalidatePath('/dashboard/users')
  revalidatePath(`/dashboard/users/${userId}`)
  return result
}

export async function verifyUserPhone(userId: string) {
  const result = await usersRepository.verifyPhone(userId)
  revalidatePath('/dashboard/users')
  revalidatePath(`/dashboard/users/${userId}`)
  return result
}

export async function deleteUser(userId: string) {
  const result = await usersRepository.delete(userId)
  revalidatePath('/dashboard/users')
  return result
}
