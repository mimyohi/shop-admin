import { supabaseServer as supabase } from '@/lib/supabase-server'
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

  /**
   * 쿠폰-상품 연결 업데이트
   */
  async updateCouponProducts(couponId: string, productIds: string[]): Promise<void> {
    // 기존 연결 삭제
    const { error: deleteError } = await supabase
      .from('coupon_products')
      .delete()
      .eq('coupon_id', couponId)

    if (deleteError) {
      console.error('Error deleting coupon products:', deleteError)
      throw new Error('Failed to delete coupon products')
    }

    // 새 연결 추가 (productIds가 비어있으면 모든 상품에 적용)
    if (productIds.length > 0) {
      const couponProducts = productIds.map((productId) => ({
        coupon_id: couponId,
        product_id: productId,
      }))

      const { error: insertError } = await supabase
        .from('coupon_products')
        .insert(couponProducts)

      if (insertError) {
        console.error('Error inserting coupon products:', insertError)
        throw new Error('Failed to insert coupon products')
      }
    }
  },

  /**
   * 이메일로 사용자에게 쿠폰 발급
   */
  async issueCouponToUserByEmail(email: string, couponId: string): Promise<any> {
    // 이메일로 사용자 찾기
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      throw new Error('해당 이메일의 사용자를 찾을 수 없습니다.')
    }

    // 이미 발급된 쿠폰인지 확인
    const { data: existingCoupon } = await supabase
      .from('user_coupons')
      .select('id')
      .eq('user_id', user.user_id)
      .eq('coupon_id', couponId)
      .single()

    if (existingCoupon) {
      throw new Error('이미 해당 사용자에게 발급된 쿠폰입니다.')
    }

    // 쿠폰 발급
    const { data, error } = await supabase
      .from('user_coupons')
      .insert({
        user_id: user.user_id,
        coupon_id: couponId,
        is_used: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error issuing coupon:', error)
      throw new Error('쿠폰 발급에 실패했습니다.')
    }

    return data
  },

  /**
   * 사용자에게 쿠폰 발급
   */
  async issueCouponToUser(userId: string, couponId: string): Promise<any> {
    // 이미 발급된 쿠폰인지 확인
    const { data: existingCoupon } = await supabase
      .from('user_coupons')
      .select('id')
      .eq('user_id', userId)
      .eq('coupon_id', couponId)
      .single()

    if (existingCoupon) {
      throw new Error('이미 발급된 쿠폰입니다.')
    }

    // 쿠폰 발급
    const { data, error } = await supabase
      .from('user_coupons')
      .insert({
        user_id: userId,
        coupon_id: couponId,
        is_used: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error issuing coupon:', error)
      throw new Error('쿠폰 발급에 실패했습니다.')
    }

    return data
  },

  /**
   * 모든 사용자에게 쿠폰 발급
   */
  async issueCouponToAllUsers(couponId: string): Promise<{ count: number }> {
    // 모든 활성 사용자 조회
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw new Error('사용자 목록 조회에 실패했습니다.')
    }

    if (!users || users.length === 0) {
      throw new Error('발급할 사용자가 없습니다.')
    }

    // 이미 발급받은 사용자 조회
    const { data: existingCoupons } = await supabase
      .from('user_coupons')
      .select('user_id')
      .eq('coupon_id', couponId)

    const existingUserIds = new Set(
      existingCoupons?.map((c) => c.user_id) || []
    )

    // 발급받지 않은 사용자에게만 발급
    const newUserCoupons = users
      .filter((user) => !existingUserIds.has(user.user_id))
      .map((user) => ({
        user_id: user.user_id,
        coupon_id: couponId,
        is_used: false,
      }))

    if (newUserCoupons.length === 0) {
      throw new Error('모든 사용자가 이미 쿠폰을 발급받았습니다.')
    }

    const { error: insertError } = await supabase
      .from('user_coupons')
      .insert(newUserCoupons)

    if (insertError) {
      console.error('Error issuing coupons:', insertError)
      throw new Error('쿠폰 일괄 발급에 실패했습니다.')
    }

    return { count: newUserCoupons.length }
  },
}
