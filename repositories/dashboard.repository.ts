import { supabaseServer as supabase } from '@/lib/supabase-server'
import { ordersRepository } from '@/repositories/orders.repository'

export interface DashboardSummary {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  todayOrders: number
  todayRevenue: number
}

export const dashboardRepository = {
  async fetchSummary(): Promise<DashboardSummary> {
    const [orderStats, { count: productsCount, error: productsError }] = await Promise.all([
      ordersRepository.getStats(),
      supabase.from('products').select('*', { count: 'exact', head: true }),
    ])

    if (productsError) {
      console.error('Error fetching product stats:', productsError)
      throw new Error('Failed to fetch product stats')
    }

    return {
      totalProducts: productsCount || 0,
      totalOrders: orderStats.totalOrders,
      totalRevenue: orderStats.totalRevenue,
      pendingOrders: orderStats.pendingOrders,
      todayOrders: orderStats.todayOrders,
      todayRevenue: orderStats.todayRevenue,
    }
  },
}
