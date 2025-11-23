'use server'

import { usersRepository } from '@/repositories/users.repository'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(userId: string, data: any) {
  try {
    const result = await usersRepository.updateProfile(userId, data)
    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${userId}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update user profile error:', error)
    return { success: false, error: error.message }
  }
}

export async function verifyUserPhone(userId: string) {
  try {
    const result = await usersRepository.verifyPhone(userId)
    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${userId}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Verify phone error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteUser(userId: string) {
  try {
    await usersRepository.delete(userId)
    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error: any) {
    console.error('Delete user error:', error)
    return { success: false, error: error.message }
  }
}
