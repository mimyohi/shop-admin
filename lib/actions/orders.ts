'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { ordersRepository } from '@/repositories/orders.repository'
import { OrderFilters } from '@/types/orders.types'

export async function fetchOrders(filters: OrderFilters = {}) {
  return ordersRepository.findMany(filters)
}

export async function fetchOrder(id: string) {
  return ordersRepository.findById(id)
}

export async function fetchOrderStats() {
  return ordersRepository.getStats()
}

export async function fetchConsultationStatusCounts(statuses: string[]) {
  return ordersRepository.countByConsultationStatus(statuses)
}

export async function updateOrderStatus(orderId: string, status: string, paymentKey?: string) {
  const result = await ordersRepository.updateStatus(orderId, status, paymentKey)
  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return result
}

export async function updateConsultationStatus(orderId: string, status: string) {
  const result = await ordersRepository.updateConsultationStatus(orderId, status)
  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return result
}

export async function updateShippingInfo(orderId: string, data: any) {
  const result = await ordersRepository.updateShippingInfo(orderId, data)
  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return result
}

export async function updateShippingAddress(orderId: string, data: {
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_postal_code?: string | null;
  shipping_address?: string | null;
  shipping_address_detail?: string | null;
}) {
  try {
    const { error } = await supabaseServer
      .from('orders')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating shipping address:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/orders')
    revalidatePath(`/dashboard/orders/${orderId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating shipping address:', error)
    return { success: false, error: '배송지 정보 업데이트에 실패했습니다.' }
  }
}

export async function assignOrderToAdmin(orderId: string, adminId: string) {
  const result = await ordersRepository.assignToAdmin(orderId, adminId)
  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return result
}

export async function updateAdminMemo(orderId: string, memo: string) {
  const result = await ordersRepository.updateAdminMemo(orderId, memo)
  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return result
}

export async function bulkUpdateConsultationStatus(orderIds: string[], targetStatus: string) {
  if (!orderIds.length) return { success: true, updated: 0 }

  const { error } = await supabaseServer
    .from('orders')
    .update({
      consultation_status: targetStatus,
      updated_at: new Date().toISOString(),
    })
    .in('id', orderIds)

  if (error) {
    console.error('Bulk update consultation status error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/orders')
  return { success: true, updated: orderIds.length }
}

export async function setAssignedAdmin(orderId: string, adminId: string | null) {
  const { error } = await supabaseServer
    .from('orders')
    .update({
      assigned_admin_id: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    console.error('Update assigned admin error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function setHandlerAdmin(orderId: string, adminId: string | null) {
  const updateData: Record<string, any> = {
    handler_admin_id: adminId,
    updated_at: new Date().toISOString(),
  }

  if (adminId) {
    updateData.handled_at = new Date().toISOString()
  }

  const { error } = await supabaseServer.from('orders').update(updateData).eq('id', orderId)

  if (error) {
    console.error('Update handler admin error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function setConsultationStatus(orderId: string, status: string) {
  const { error } = await supabaseServer
    .from('orders')
    .update({
      consultation_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    console.error('Update consultation status by id error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function setShippingInfo(orderId: string, shippingData: { shipping_company?: string; tracking_number?: string }) {
  const { error } = await supabaseServer
    .from('orders')
    .update({
      ...shippingData,
      shipped_at: shippingData.tracking_number ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    console.error('Update shipping info by id error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function setAdminMemo(orderId: string, memo: string | null) {
  const { error } = await supabaseServer
    .from('orders')
    .update({
      admin_memo: memo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    console.error('Update admin memo by id error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function updateOrderItemOptionSettings(orderItemId: string, orderId: string, selectedOptionSettings: any[]) {
  const { error } = await supabaseServer
    .from('order_items')
    .update({
      selected_option_settings: selectedOptionSettings,
    })
    .eq('id', orderItemId)

  if (error) {
    console.error('Update order item option settings error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function exportShippingExcel(orderIds: string[]) {
  if (!orderIds.length) {
    return { success: false, error: '선택된 주문이 없습니다.' }
  }

  // 선택된 주문들의 상세 정보 조회 (order_items 포함)
  const { data: orders, error: fetchError } = await supabaseServer
    .from('orders')
    .select('*, order_items(*)')
    .in('id', orderIds)

  if (fetchError) {
    console.error('Fetch orders for excel error:', fetchError)
    return { success: false, error: fetchError.message }
  }

  if (!orders || orders.length === 0) {
    return { success: false, error: '주문을 찾을 수 없습니다.' }
  }

  // 엑셀 생성
  const { generateShippingExcel } = await import('@/lib/utils/excel-export')
  const excelBase64 = generateShippingExcel(orders as Parameters<typeof generateShippingExcel>[0])

  return { success: true, data: excelBase64, count: orders.length }
}

export async function exportShippingExcelAndUpdateStatus(orderIds: string[]) {
  if (!orderIds.length) {
    return { success: false, error: '선택된 주문이 없습니다.' }
  }

  // 선택된 주문들의 상세 정보 조회 (order_items 포함)
  const { data: orders, error: fetchError } = await supabaseServer
    .from('orders')
    .select('*, order_items(*)')
    .in('id', orderIds)

  if (fetchError) {
    console.error('Fetch orders for excel error:', fetchError)
    return { success: false, error: fetchError.message }
  }

  if (!orders || orders.length === 0) {
    return { success: false, error: '주문을 찾을 수 없습니다.' }
  }

  // 엑셀 생성
  const { generateShippingExcel } = await import('@/lib/utils/excel-export')
  const excelBase64 = generateShippingExcel(orders as Parameters<typeof generateShippingExcel>[0])

  // 상태를 배송처리로 업데이트
  const { error: updateError } = await supabaseServer
    .from('orders')
    .update({
      consultation_status: 'shipped',
      updated_at: new Date().toISOString(),
    })
    .in('id', orderIds)

  if (updateError) {
    console.error('Update status to shipped error:', updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath('/dashboard/orders')
  return { success: true, data: excelBase64, count: orders.length }
}
