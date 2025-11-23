'use server'

import { revalidatePath } from 'next/cache'
import { adminUsersRepository } from '@/repositories/admin-users.repository'

export async function fetchAdminUsers(filters: { is_active?: boolean } = {}) {
  return adminUsersRepository.findMany(filters)
}

export async function deleteAdminUser(id: string) {
  const result = await adminUsersRepository.delete(id)
  revalidatePath('/dashboard/settings/admin-users')
  return result
}

export async function resetAdminPassword(params: {
  masterAdminId: string
  targetAdminId: string
  newPassword: string
}) {
  const result = await adminUsersRepository.resetPassword(
    params.masterAdminId,
    params.targetAdminId,
    params.newPassword
  )

  revalidatePath('/dashboard/settings/admin-users')
  return result
}
