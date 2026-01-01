'use server'

import bcrypt from 'bcryptjs'
import { supabaseServer as supabase } from '@/lib/supabase-server'
import { AdminUser } from '@/models/admin.model'

export async function loginAdmin(
  username: string,
  password: string
): Promise<AdminUser | null> {
  try {
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (error || !adminUser) {
      return null
    }

    const passwordMatch = await bcrypt.compare(
      password,
      adminUser.password_hash
    )

    if (!passwordMatch) {
      return null
    }

    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id)

    await logAdminActivity(adminUser.id, 'login', null, null, {
      success: true,
    })

    return {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      full_name: adminUser.full_name,
      role: adminUser.role as 'admin' | 'master' | undefined,
      is_active: adminUser.is_active ?? undefined,
      created_at: adminUser.created_at ?? undefined,
      last_login_at: adminUser.last_login_at ?? undefined,
    }
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

export async function createAdminUser(
  creatorId: string,
  username: string,
  email: string,
  password: string,
  fullName: string,
  role: 'admin' | 'master' = 'admin'
) {
  try {
    console.log('Creating admin user, creatorId:', creatorId)
    const { data: creator, error: creatorError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('id', creatorId)
      .single()

    if (creatorError || !creator) {
      console.error('Creator lookup failed:', {
        creatorId,
        error: creatorError,
        creator,
        errorDetails: creatorError?.message,
        errorCode: creatorError?.code,
      })
      throw new Error('등록 권한이 없습니다. 다시 로그인 후 시도해주세요.')
    }

    if (creator.role !== 'master') {
      throw new Error('관리자 생성 권한이 없습니다.')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    console.log('Attempting to insert admin user:', {
      username,
      email,
      full_name: fullName,
      role,
      created_by: creator.id,
    })

    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        created_by: creator.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert admin user failed:', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
      })
      throw error
    }

    await logAdminActivity(
      creatorId,
      'create_admin_user',
      'admin_user',
      data.id,
      {
        username,
        email,
        role,
      }
    )

    return data
  } catch (error) {
    console.error('Create admin user error:', error)
    throw error
  }
}

export async function resetAdminPassword(
  masterAdminId: string,
  targetAdminId: string,
  newPassword: string
) {
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10)

    const { error } = await supabase
      .from('admin_users')
      .update({ password_hash: passwordHash })
      .eq('id', targetAdminId)

    if (error) throw error

    await logAdminActivity(
      masterAdminId,
      'reset_password',
      'admin_user',
      targetAdminId,
      {
        target_admin_id: targetAdminId,
      }
    )

    return true
  } catch (error) {
    console.error('Reset admin password error:', error)
    throw error
  }
}

export async function logAdminActivity(
  adminUserId: string,
  action: string,
  resourceType: string | null,
  resourceId: string | null,
  details: Record<string, unknown>
) {
  try {
    await supabase.from('admin_activity_logs').insert({
      admin_user_id: adminUserId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details as any,
    })
  } catch (error) {
    console.error('Log activity error:', error)
  }
}
