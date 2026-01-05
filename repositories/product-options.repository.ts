import { supabaseServer as supabase } from '@/lib/supabase-server'
import type { ProductAddon, ProductOption } from '@/models'

export interface ProductConfiguration {
  options: []  // 이전 options는 제거됨, 호환성을 위해 빈 배열
  addons: ProductAddon[]
}

export const productOptionsRepository = {
  async findConfigurationByProductId(productId: string): Promise<ProductConfiguration> {
    const addons = await this.findAddonsByProductId(productId)
    return { options: [], addons }
  },

  /**
   * 모든 옵션 조회 (product_id가 null인 것만 - 아직 연결되지 않은 옵션)
   */
  async findUnlinkedOptions(): Promise<ProductOption[]> {
    const { data, error } = await supabase
      .from('product_options')
      .select('*')
      .is('product_id', null)
      .is('deleted_at', null)
      .order('name')

    if (error) {
      console.error('Error fetching unlinked options:', error)
      throw new Error('Failed to fetch unlinked options')
    }

    return (data as any) || []
  },

  /**
   * 특정 상품에 연결된 옵션들 조회 (settings, types 포함)
   */
  async findByProductId(productId: string): Promise<ProductOption[]> {
    const { data, error } = await supabase
      .from('product_options')
      .select(`
        *,
        settings:product_option_settings(
          *,
          types:product_option_setting_types(*)
        )
      `)
      .eq('product_id', productId)
      .is('deleted_at', null)
      .order('display_order')

    if (error) {
      console.error('Error fetching options by product_id:', error)
      throw new Error('Failed to fetch options by product_id')
    }

    // settings 정렬
    const sortedData = (data || []).map((option: any) => ({
      ...option,
      settings: (option.settings || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((setting: any) => ({
          ...setting,
          types: (setting.types || []).sort((a: any, b: any) => a.display_order - b.display_order)
        }))
    }))

    return sortedData as ProductOption[]
  },

  /**
   * 옵션을 상품에 연결
   */
  async linkToProduct(optionId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from('product_options')
      .update({ product_id: productId })
      .eq('id', optionId)

    if (error) {
      console.error('Error linking option to product:', error)
      throw new Error('Failed to link option to product')
    }
  },

  /**
   * 옵션과 상품 연결 해제
   */
  async unlinkFromProduct(optionId: string): Promise<void> {
    const { error } = await supabase
      .from('product_options')
      .update({ product_id: null })
      .eq('id', optionId)

    if (error) {
      console.error('Error unlinking option from product:', error)
      throw new Error('Failed to unlink option from product')
    }
  },

  /**
   * 옵션 ID로 조회
   */
  async findById(optionId: string): Promise<ProductOption | null> {
    const { data, error } = await supabase
      .from('product_options')
      .select('*')
      .eq('id', optionId)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching option:', error)
      return null
    }

    return data as any
  },

  // === Addons 관련 메서드 ===
  async findAddonsByProductId(productId: string) {
    const { data, error } = await supabase
      .from('product_addons')
      .select('*')
      .eq('product_id', productId)
      .order('display_order')

    if (error) {
      console.error('Error fetching product addons:', error)
      throw new Error('Failed to fetch product addons')
    }

    return data || []
  },

  // === Addon 생성/수정/삭제 메서드 ===
  async createAddon(productId: string, data: any): Promise<ProductAddon> {
    const { data: addon, error } = await supabase
      .from('product_addons')
      .insert({
        product_id: productId,
        ...data,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product addon:', error)
      throw new Error('Failed to create product addon')
    }

    return addon
  },

  async updateAddon(addonId: string, data: any): Promise<ProductAddon> {
    const { data: addon, error } = await supabase
      .from('product_addons')
      .update(data)
      .eq('id', addonId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product addon:', error)
      throw new Error('Failed to update product addon')
    }

    return addon
  },

  async deleteAddon(addonId: string): Promise<void> {
    const { error } = await supabase
      .from('product_addons')
      .delete()
      .eq('id', addonId)

    if (error) {
      console.error('Error deleting product addon:', error)
      throw new Error('Failed to delete product addon')
    }
  },
}
