'use server'

import { couponsRepository } from '@/repositories/coupons.repository'
import { revalidatePath } from 'next/cache'

export async function createCoupon(data: any, productIds?: string[]) {
  try {
    const result = await couponsRepository.create(data)

    // 쿠폰-상품 연결 처리
    if (productIds !== undefined) {
      await couponsRepository.updateCouponProducts(result.id, productIds)
    }

    revalidatePath('/dashboard/coupons')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Create coupon error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCoupon(id: string, data: any, productIds?: string[]) {
  try {
    const result = await couponsRepository.update(id, data)

    // 쿠폰-상품 연결 처리
    if (productIds !== undefined) {
      await couponsRepository.updateCouponProducts(id, productIds)
    }

    revalidatePath('/dashboard/coupons')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update coupon error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCoupon(id: string) {
  try {
    await couponsRepository.delete(id)
    revalidatePath('/dashboard/coupons')
    return { success: true }
  } catch (error: any) {
    console.error('Delete coupon error:', error)
    return { success: false, error: error.message }
  }
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
  try {
    await couponsRepository.update(id, { is_active: isActive })
    revalidatePath('/dashboard/coupons')
    return { success: true }
  } catch (error: any) {
    console.error('Toggle coupon status error:', error)
    return { success: false, error: error.message }
  }
}

export async function issueCouponToUser(userId: string, couponId: string) {
  try {
    const result = await couponsRepository.issueCouponToUser(userId, couponId)
    revalidatePath('/dashboard/coupons')
    revalidatePath('/dashboard/users')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Issue coupon error:', error)
    return { success: false, error: error.message }
  }
}

export async function issueCouponToAllUsers(couponId: string) {
  try {
    const result = await couponsRepository.issueCouponToAllUsers(couponId)
    revalidatePath('/dashboard/coupons')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Issue coupon to all error:', error)
    return { success: false, error: error.message }
  }
}

export async function issueCouponToUserByEmail(email: string, couponId: string) {
  try {
    const result = await couponsRepository.issueCouponToUserByEmail(email, couponId)
    revalidatePath('/dashboard/coupons')
    revalidatePath('/dashboard/users')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Issue coupon by email error:', error)
    return { success: false, error: error.message }
  }
}
