import { supabaseServer as supabase } from '@/lib/supabase-server'
import { MainBanner, ProductBanner } from '@/models'
import {
  BannerFilters,
  CreateBannerData,
  UpdateBannerData,
} from '@/types/banners.types'

// 메인 배너 Repository
export const mainBannersRepository = {
  /**
   * 메인 배너 목록 조회
   */
  async findMany(filters: BannerFilters = {}) {
    const { deviceType, isActive, page = 1, limit = 20 } = filters

    const shouldPaginate = limit !== 'all'
    const numericLimit = typeof limit === 'number' ? limit : undefined
    const from = shouldPaginate ? (page - 1) * (numericLimit as number) : undefined
    const to = shouldPaginate && numericLimit ? from! + numericLimit - 1 : undefined

    let query = supabase.from('main_banners').select('*', { count: 'exact' })

    if (deviceType) {
      query = query.eq('device_type', deviceType)
    }

    if (typeof isActive === 'boolean') {
      query = query.eq('is_active', isActive)
    }

    query = query.order('display_order', { ascending: true })

    if (shouldPaginate && typeof from === 'number' && typeof to === 'number') {
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching main banners:', error)
      throw new Error('Failed to fetch main banners')
    }

    const totalCount = shouldPaginate && typeof count === 'number' ? count : count ?? data?.length ?? 0
    const calculatedPages = shouldPaginate && numericLimit ? Math.ceil(totalCount / numericLimit) : 1

    return {
      banners: (data || []) as MainBanner[],
      totalCount,
      totalPages: Math.max(1, calculatedPages),
      currentPage: shouldPaginate ? page : 1,
    }
  },

  /**
   * 메인 배너 상세 조회
   */
  async findById(id: string): Promise<MainBanner | null> {
    const { data, error } = await supabase
      .from('main_banners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching main banner:', error)
      return null
    }

    return data as MainBanner
  },

  /**
   * 메인 배너 생성
   */
  async create(bannerData: CreateBannerData): Promise<MainBanner> {
    const { data, error } = await supabase
      .from('main_banners')
      .insert(bannerData)
      .select()
      .single()

    if (error) {
      console.error('Error creating main banner:', error)
      throw new Error('Failed to create main banner')
    }

    return data as MainBanner
  },

  /**
   * 메인 배너 수정
   */
  async update(id: string, updateData: UpdateBannerData): Promise<MainBanner> {
    const { data, error } = await supabase
      .from('main_banners')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating main banner:', error)
      throw new Error('Failed to update main banner')
    }

    return data as MainBanner
  },

  /**
   * 메인 배너 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('main_banners').delete().eq('id', id)

    if (error) {
      console.error('Error deleting main banner:', error)
      throw new Error('Failed to delete main banner')
    }
  },

  /**
   * 메인 배너 활성화 상태 토글
   */
  async toggleActive(id: string, isActive: boolean): Promise<MainBanner> {
    const { data, error } = await supabase
      .from('main_banners')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling main banner active:', error)
      throw new Error('Failed to toggle main banner active')
    }

    return data as MainBanner
  },

  /**
   * 메인 배너 순서 업데이트
   */
  async updateOrder(banners: { id: string; display_order: number }[]): Promise<void> {
    for (const banner of banners) {
      const { error } = await supabase
        .from('main_banners')
        .update({ display_order: banner.display_order, updated_at: new Date().toISOString() })
        .eq('id', banner.id)

      if (error) {
        console.error('Error updating main banner order:', error)
        throw new Error('Failed to update main banner order')
      }
    }
  },
}

// 상품 배너 Repository
export const productBannersRepository = {
  /**
   * 상품 배너 목록 조회
   */
  async findMany(filters: BannerFilters = {}) {
    const { deviceType, isActive, page = 1, limit = 20 } = filters

    const shouldPaginate = limit !== 'all'
    const numericLimit = typeof limit === 'number' ? limit : undefined
    const from = shouldPaginate ? (page - 1) * (numericLimit as number) : undefined
    const to = shouldPaginate && numericLimit ? from! + numericLimit - 1 : undefined

    let query = supabase.from('product_banners').select('*', { count: 'exact' })

    if (deviceType) {
      query = query.eq('device_type', deviceType)
    }

    if (typeof isActive === 'boolean') {
      query = query.eq('is_active', isActive)
    }

    query = query.order('display_order', { ascending: true })

    if (shouldPaginate && typeof from === 'number' && typeof to === 'number') {
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching product banners:', error)
      throw new Error('Failed to fetch product banners')
    }

    const totalCount = shouldPaginate && typeof count === 'number' ? count : count ?? data?.length ?? 0
    const calculatedPages = shouldPaginate && numericLimit ? Math.ceil(totalCount / numericLimit) : 1

    return {
      banners: (data || []) as ProductBanner[],
      totalCount,
      totalPages: Math.max(1, calculatedPages),
      currentPage: shouldPaginate ? page : 1,
    }
  },

  /**
   * 상품 배너 상세 조회
   */
  async findById(id: string): Promise<ProductBanner | null> {
    const { data, error } = await supabase
      .from('product_banners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching product banner:', error)
      return null
    }

    return data as ProductBanner
  },

  /**
   * 상품 배너 생성
   */
  async create(bannerData: CreateBannerData): Promise<ProductBanner> {
    const { data, error } = await supabase
      .from('product_banners')
      .insert(bannerData)
      .select()
      .single()

    if (error) {
      console.error('Error creating product banner:', error)
      throw new Error('Failed to create product banner')
    }

    return data as ProductBanner
  },

  /**
   * 상품 배너 수정
   */
  async update(id: string, updateData: UpdateBannerData): Promise<ProductBanner> {
    const { data, error } = await supabase
      .from('product_banners')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product banner:', error)
      throw new Error('Failed to update product banner')
    }

    return data as ProductBanner
  },

  /**
   * 상품 배너 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('product_banners').delete().eq('id', id)

    if (error) {
      console.error('Error deleting product banner:', error)
      throw new Error('Failed to delete product banner')
    }
  },

  /**
   * 상품 배너 활성화 상태 토글
   */
  async toggleActive(id: string, isActive: boolean): Promise<ProductBanner> {
    const { data, error } = await supabase
      .from('product_banners')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling product banner active:', error)
      throw new Error('Failed to toggle product banner active')
    }

    return data as ProductBanner
  },

  /**
   * 상품 배너 순서 업데이트
   */
  async updateOrder(banners: { id: string; display_order: number }[]): Promise<void> {
    for (const banner of banners) {
      const { error } = await supabase
        .from('product_banners')
        .update({ display_order: banner.display_order, updated_at: new Date().toISOString() })
        .eq('id', banner.id)

      if (error) {
        console.error('Error updating product banner order:', error)
        throw new Error('Failed to update product banner order')
      }
    }
  },
}
