import { supabase } from '@/lib/supabase'
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
      stockStatus,
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

    if (stockStatus === 'in_stock') {
      query = query.gt('stock', 0)
    } else if (stockStatus === 'out_of_stock') {
      query = query.eq('stock', 0)
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
}
