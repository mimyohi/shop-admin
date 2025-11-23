'use server'

import { ordersRepository } from '@/repositories/orders.repository'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const result = await ordersRepository.updateStatus(orderId, status)
    revalidatePath('/dashboard/orders')
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update order status error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateConsultationStatus(orderId: string, status: string) {
  try {
    const result = await ordersRepository.updateConsultationStatus(orderId, status)
    revalidatePath('/dashboard/orders')
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update consultation status error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateShippingInfo(orderId: string, data: any) {
  try {
    const result = await ordersRepository.updateShippingInfo(orderId, data)
    revalidatePath('/dashboard/orders')
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update shipping info error:', error)
    return { success: false, error: error.message }
  }
}

export async function assignOrderToAdmin(orderId: string, adminId: string) {
  try {
    const result = await ordersRepository.assignToAdmin(orderId, adminId)
    revalidatePath('/dashboard/orders')
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Assign order error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateAdminMemo(orderId: string, memo: string) {
  try {
    const result = await ordersRepository.updateAdminMemo(orderId, memo)
    revalidatePath('/dashboard/orders')
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update admin memo error:', error)
    return { success: false, error: error.message }
  }
}
