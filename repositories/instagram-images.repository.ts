import { supabaseServer as supabase } from '@/lib/supabase-server'
import { InstagramImage } from '@/models'
import {
  InstagramImageFilters,
  CreateInstagramImageData,
  UpdateInstagramImageData,
} from '@/types/instagram-images.types'

export const instagramImagesRepository = {
  /**
   * 인스타그램 이미지 목록 조회
   */
  async findMany(filters: InstagramImageFilters = {}) {
    const { isActive, page = 1, limit = 20 } = filters

    const shouldPaginate = limit !== 'all'
    const numericLimit = typeof limit === 'number' ? limit : undefined
    const from = shouldPaginate ? (page - 1) * (numericLimit as number) : undefined
    const to = shouldPaginate && numericLimit ? from! + numericLimit - 1 : undefined

    let query = supabase.from('instagram_images').select('*', { count: 'exact' })

    if (typeof isActive === 'boolean') {
      query = query.eq('is_active', isActive)
    }

    query = query.order('display_order', { ascending: true })

    if (shouldPaginate && typeof from === 'number' && typeof to === 'number') {
      query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching instagram images:', error)
      throw new Error('Failed to fetch instagram images')
    }

    const totalCount = shouldPaginate && typeof count === 'number' ? count : count ?? data?.length ?? 0
    const calculatedPages = shouldPaginate && numericLimit ? Math.ceil(totalCount / numericLimit) : 1

    return {
      images: (data || []) as InstagramImage[],
      totalCount,
      totalPages: Math.max(1, calculatedPages),
      currentPage: shouldPaginate ? page : 1,
    }
  },

  /**
   * 인스타그램 이미지 상세 조회
   */
  async findById(id: string): Promise<InstagramImage | null> {
    const { data, error } = await supabase
      .from('instagram_images')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching instagram image:', error)
      return null
    }

    return data as InstagramImage
  },

  /**
   * 인스타그램 이미지 생성
   */
  async create(imageData: CreateInstagramImageData): Promise<InstagramImage> {
    const { data, error } = await supabase
      .from('instagram_images')
      .insert(imageData)
      .select()
      .single()

    if (error) {
      console.error('Error creating instagram image:', error)
      throw new Error('Failed to create instagram image')
    }

    return data as InstagramImage
  },

  /**
   * 인스타그램 이미지 수정
   */
  async update(id: string, updateData: UpdateInstagramImageData): Promise<InstagramImage> {
    const { data, error } = await supabase
      .from('instagram_images')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating instagram image:', error)
      throw new Error('Failed to update instagram image')
    }

    return data as InstagramImage
  },

  /**
   * 인스타그램 이미지 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('instagram_images').delete().eq('id', id)

    if (error) {
      console.error('Error deleting instagram image:', error)
      throw new Error('Failed to delete instagram image')
    }
  },

  /**
   * 인스타그램 이미지 활성화 상태 토글
   */
  async toggleActive(id: string, isActive: boolean): Promise<InstagramImage> {
    const { data, error } = await supabase
      .from('instagram_images')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling instagram image active:', error)
      throw new Error('Failed to toggle instagram image active')
    }

    return data as InstagramImage
  },

  /**
   * 인스타그램 이미지 순서 업데이트
   */
  async updateOrder(images: { id: string; display_order: number }[]): Promise<void> {
    for (const image of images) {
      const { error } = await supabase
        .from('instagram_images')
        .update({ display_order: image.display_order, updated_at: new Date().toISOString() })
        .eq('id', image.id)

      if (error) {
        console.error('Error updating instagram image order:', error)
        throw new Error('Failed to update instagram image order')
      }
    }
  },
}
