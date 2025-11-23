'use server'

import { revalidatePath } from 'next/cache'
import { couponsRepository } from '@/repositories/coupons.repository'
import { CouponFilters, CreateCouponData, UpdateCouponData } from '@/types/coupons.types'

export async function fetchCoupons(filters: CouponFilters = {}) {
  return couponsRepository.findMany(filters)
}

export async function fetchCoupon(id: string) {
  return couponsRepository.findById(id)
}

export async function fetchCouponProductIds(couponId: string) {
  return couponsRepository.findAssignedProductIds(couponId)
}

export async function createCoupon(data: CreateCouponData) {
  const result = await couponsRepository.create(data)
  revalidatePath('/dashboard/coupons')
  return result
}

export async function updateCoupon(id: string, data: UpdateCouponData) {
  const result = await couponsRepository.update(id, data)
  revalidatePath('/dashboard/coupons')
  revalidatePath(`/dashboard/coupons/${id}`)
  return result
}

export async function deleteCoupon(id: string) {
  const result = await couponsRepository.delete(id)
  revalidatePath('/dashboard/coupons')
  return result
}

export async function toggleCouponActive(id: string, isActive: boolean) {
  const result = await couponsRepository.toggleActive(id, isActive)
  revalidatePath('/dashboard/coupons')
  revalidatePath(`/dashboard/coupons/${id}`)
  return result
}

export async function issueCouponToUserByEmail(email: string, couponId: string) {
  try {
    const data = await couponsRepository.issueCouponToUserByEmail(email, couponId)
    revalidatePath('/dashboard/coupons')
    return { success: true, data }
  } catch (error: any) {
    console.error('Issue coupon by email error:', error)
    return { success: false, error: error.message }
  }
}

export async function issueCouponToUser(userId: string, couponId: string) {
  try {
    const data = await couponsRepository.issueCouponToUser(userId, couponId)
    revalidatePath('/dashboard/coupons')
    return { success: true, data }
  } catch (error: any) {
    console.error('Issue coupon to user error:', error)
    return { success: false, error: error.message }
  }
}
