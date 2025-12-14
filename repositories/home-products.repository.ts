import { supabaseServer as supabase } from '@/lib/supabase-server'
import { HomeProductWithProduct, Product } from '@/models'

export const homeProductsRepository = {
  /**
   * 홈 상품 목록 조회 (상품 정보 포함)
   * 삭제된 상품(deleted_at이 설정된 상품)은 제외
   */
  async findAll(): Promise<HomeProductWithProduct[]> {
    const { data, error } = await supabase
      .from('home_products')
      .select(`
        *,
        product:products!inner (*)
      `)
      .is('product.deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching home products:', error)
      throw new Error('Failed to fetch home products')
    }

    return (data || []) as HomeProductWithProduct[]
  },

  /**
   * 모든 상품 목록 조회 (선택용)
   * 삭제된 상품(deleted_at이 설정된 상품)은 제외
   */
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching all products:', error)
      throw new Error('Failed to fetch products')
    }

    return (data || []) as Product[]
  },

  /**
   * 홈 상품 설정 (전체 교체)
   * 최대 6개까지만 허용
   */
  async setHomeProducts(productIds: string[]): Promise<HomeProductWithProduct[]> {
    // 최대 6개 제한
    const limitedProductIds = productIds.slice(0, 6)

    // 기존 홈 상품 모두 삭제
    const { error: deleteError } = await supabase
      .from('home_products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 삭제

    if (deleteError) {
      console.error('Error deleting home products:', deleteError)
      throw new Error('Failed to delete existing home products')
    }

    // 새로운 홈 상품 추가
    if (limitedProductIds.length > 0) {
      const insertData = limitedProductIds.map((productId, index) => ({
        product_id: productId,
        display_order: index,
      }))

      const { error: insertError } = await supabase
        .from('home_products')
        .insert(insertData)

      if (insertError) {
        console.error('Error inserting home products:', insertError)
        throw new Error('Failed to set home products')
      }
    }

    // 업데이트된 목록 반환
    return this.findAll()
  },

  /**
   * 홈 상품 순서 변경
   */
  async updateOrder(orderUpdates: { id: string; display_order: number }[]): Promise<void> {
    for (const update of orderUpdates) {
      const { error } = await supabase
        .from('home_products')
        .update({ display_order: update.display_order })
        .eq('id', update.id)

      if (error) {
        console.error('Error updating home product order:', error)
        throw new Error('Failed to update home product order')
      }
    }
  },

  /**
   * 홈 상품 삭제
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('home_products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error removing home product:', error)
      throw new Error('Failed to remove home product')
    }
  },

  /**
   * 홈 상품 추가 (최대 6개 체크)
   */
  async add(productId: string): Promise<HomeProductWithProduct[]> {
    // 현재 개수 확인
    const current = await this.findAll()
    if (current.length >= 6) {
      throw new Error('최대 6개까지만 홈 상품으로 설정할 수 있습니다.')
    }

    // 이미 존재하는지 확인
    const exists = current.some(hp => hp.product_id === productId)
    if (exists) {
      throw new Error('이미 홈 상품으로 설정된 상품입니다.')
    }

    const { error } = await supabase
      .from('home_products')
      .insert({
        product_id: productId,
        display_order: current.length,
      })

    if (error) {
      console.error('Error adding home product:', error)
      throw new Error('Failed to add home product')
    }

    return this.findAll()
  },
}
