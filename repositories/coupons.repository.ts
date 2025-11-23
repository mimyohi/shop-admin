import { supabase } from '@/lib/supabase'
import { Coupon } from '@/models'
import { CouponFilters, CreateCouponData, UpdateCouponData } from '@/types/coupons.types'

export const couponsRepository = {
  /**
   * 쿠폰 목록 조회 (관리자용)
   */
  async findMany(
    filters: {
      search?: string
      is_active?: boolean
      page?: number
      limit?: number | 'all'
    } = {}
  ) {
    const { search, is_active, page = 1, limit = 20 } = filters

    const shouldPaginate = limit !== 'all'
    const numericLimit = typeof limit === 'number' ? limit : undefined
    const from = shouldPaginate ? (page - 1) * (numericLimit as number) : undefined
    const to = shouldPaginate && numericLimit ? from! + numericLimit - 1 : undefined

    let query = supabase
      .from('coupons')
      .select(
        `
        *,
        coupon_products (
          product_id,
          products (name)
        )
      `,
        { count: 'exact' }
      )

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }

    query = query.order('created_at', { ascending: false })

    if (shouldPaginate && typeof from === 'number' && typeof to === 'number') {
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching coupons:', error)
      throw new Error('Failed to fetch coupons')
    }

    const normalizedCoupons =
      data?.map((coupon: any) => {
        const { coupon_products, ...rest } = coupon
        return {
          ...rest,
          product_count: coupon_products?.length || 0,
          product_names:
            coupon_products
              ?.map((cp: any) => cp.products?.name)
              .filter(Boolean) || [],
        }
      }) || []

    const totalCount =
      shouldPaginate && typeof count === 'number'
        ? count
        : count ?? normalizedCoupons.length ?? 0

    return {
      coupons: normalizedCoupons,
      totalCount,
      totalPages:
        shouldPaginate && numericLimit
          ? Math.ceil(totalCount / numericLimit)
          : 1,
      currentPage: shouldPaginate ? page : 1,
    }
  },

  /**
   * 쿠폰 상세 조회
   */
  async findById(id: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching coupon:', error)
      return null
    }

    return data
  },

  /**
   * 쿠폰 생성
   */
  async create(couponData: CreateCouponData): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        ...couponData,
        used_count: 0,
        is_active: couponData.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      throw new Error('Failed to create coupon')
    }

    return data
  },

  /**
   * 쿠폰 수정
   */
  async update(id: string, updateData: UpdateCouponData): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating coupon:', error)
      throw new Error('Failed to update coupon')
    }

    return data
  },

  /**
   * 쿠폰 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('coupons').delete().eq('id', id)

    if (error) {
      console.error('Error deleting coupon:', error)
      throw new Error('Failed to delete coupon')
    }
  },

  /**
   * 쿠폰 활성화/비활성화
   */
  async toggleActive(id: string, isActive: boolean): Promise<Coupon> {
    return this.update(id, { is_active: isActive })
  },

  /**
   * 쿠폰에 연결된 상품 ID 목록 조회
   */
  async findAssignedProductIds(couponId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('coupon_products')
      .select('product_id')
      .eq('coupon_id', couponId)

    if (error) {
      console.error('Error fetching coupon products:', error)
      throw new Error('Failed to fetch coupon products')
    }

    return data?.map((item) => item.product_id) || []
  },
}
