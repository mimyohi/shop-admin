import { supabaseServer as supabase } from '@/lib/supabase-server'
import { Product } from '@/models'
import {
  ProductFilters,
  CreateProductData,
  UpdateProductData,
} from '@/types/products.types'

export const productsRepository = {
  /**
   * 상품 목록 조회 (관리자용)
   */
  async findMany(filters: ProductFilters = {}) {
    const {
      search,
      category,
      page = 1,
      limit = 20,
      isVisibleOnMain,
    } = filters

    const shouldPaginate = limit !== 'all'
    const numericLimit = typeof limit === 'number' ? limit : undefined
    const from = shouldPaginate ? (page - 1) * (numericLimit as number) : undefined
    const to = shouldPaginate && numericLimit ? from! + numericLimit - 1 : undefined

    let query = supabase.from('products').select('*', { count: 'exact' })

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (typeof isVisibleOnMain === 'boolean') {
      query = query.eq('is_visible_on_main', isVisibleOnMain)
    }

    query = query.order('created_at', { ascending: false })

    if (shouldPaginate && typeof from === 'number' && typeof to === 'number') {
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to fetch products')
    }

    const totalCount =
      shouldPaginate && typeof count === 'number'
        ? count
        : count ?? data?.length ?? 0

    const calculatedPages =
      shouldPaginate && numericLimit
        ? Math.ceil(totalCount / numericLimit)
        : 1

    return {
      products: data || [],
      totalCount,
      totalPages: Math.max(1, calculatedPages),
      currentPage: shouldPaginate ? page : 1,
    }
  },

  /**
   * 상품 상세 조회
   */
  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

    return data
  },

  /**
   * 상품 생성
   */
  async create(productData: CreateProductData): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      throw new Error('Failed to create product')
    }

    return data
  },

  /**
   * 상품 수정
   */
  async update(id: string, updateData: UpdateProductData): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      throw new Error('Failed to update product')
    }

    return data
  },

  /**
   * 상품 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      throw new Error('Failed to delete product')
    }
  },

  /**
   * 카테고리 목록 조회
   */
  async findCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)

    if (error) {
      console.error('Error fetching categories:', error)
      throw new Error('Failed to fetch categories')
    }

    const uniqueCategories = Array.from(
      new Set(data?.map((item) => item.category).filter(Boolean))
    ) as string[]

    return uniqueCategories
  },

  /**
   * 상품 품절 상태 토글
   */
  async toggleOutOfStock(id: string, isOutOfStock: boolean): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        is_out_of_stock: isOutOfStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling product out of stock:', error)
      throw new Error('Failed to toggle product out of stock')
    }

    return data
  },

  /**
   * NEW 뱃지 토글
   */
  async toggleNewBadge(id: string, isNewBadge: boolean): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        is_new_badge: isNewBadge,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling product new badge:', error)
      throw new Error('Failed to toggle product new badge')
    }

    return data
  },

  /**
   * SALE 뱃지 토글
   */
  async toggleSaleBadge(id: string, isSaleBadge: boolean): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        is_sale_badge: isSaleBadge,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling product sale badge:', error)
      throw new Error('Failed to toggle product sale badge')
    }

    return data
  },

  /**
   * 상품 복제
   */
  async duplicate(id: string): Promise<Product> {
    // 1. 원본 상품 정보 가져오기
    const { data: originalProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !originalProduct) {
      console.error('Error fetching original product:', fetchError)
      throw new Error('Failed to fetch original product')
    }

    // 2. 새 상품 생성 (slug는 자동 생성됨)
    const { id: _, slug: __, created_at: ___, updated_at: ____, ...productData } = originalProduct
    const newProductData = {
      ...productData,
      name: `${originalProduct.name} (복사)`,
      is_visible_on_main: false, // 복사본은 기본적으로 숨김
    }

    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert(newProductData)
      .select()
      .single()

    if (createError || !newProduct) {
      console.error('Error creating duplicate product:', createError)
      throw new Error('Failed to create duplicate product')
    }

    // 3. 옵션 복사
    const { data: options, error: optionsError } = await supabase
      .from('product_options')
      .select('*')
      .eq('product_id', id)

    if (!optionsError && options && options.length > 0) {
      for (const option of options) {
        const { id: optionId, product_id: _, created_at: ___, updated_at: ____, ...optionData } = option

        const { data: newOption, error: newOptionError } = await supabase
          .from('product_options')
          .insert({ ...optionData, product_id: newProduct.id })
          .select()
          .single()

        if (!newOptionError && newOption) {
          // 4. 옵션 값 복사
          const { data: values, error: valuesError } = await supabase
            .from('product_option_values')
            .select('*')
            .eq('option_id', optionId)

          if (!valuesError && values && values.length > 0) {
            const newValues = values.map(({ id: _, option_id: __, created_at: ___, updated_at: ____, ...valueData }) => ({
              ...valueData,
              option_id: newOption.id,
            }))

            await supabase.from('product_option_values').insert(newValues)
          }
        }
      }
    }

    // 5. 추가상품 복사
    const { data: addons, error: addonsError } = await supabase
      .from('product_addons')
      .select('*')
      .eq('product_id', id)

    if (!addonsError && addons && addons.length > 0) {
      const newAddons = addons.map(({ id: _, product_id: __, created_at: ___, updated_at: ____, ...addonData }) => ({
        ...addonData,
        product_id: newProduct.id,
      }))

      await supabase.from('product_addons').insert(newAddons)
    }

    return newProduct
  },
}
