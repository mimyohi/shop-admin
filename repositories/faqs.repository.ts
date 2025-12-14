import { supabaseServer as supabase } from '@/lib/supabase-server'
import { FAQ } from '@/models'
import {
  FAQFilters,
  CreateFAQData,
  UpdateFAQData,
} from '@/types/faqs.types'

export const faqsRepository = {
  async findMany(filters: FAQFilters = {}) {
    const { category, isActive, page = 1, limit = 20 } = filters

    const shouldPaginate = limit !== 'all'
    const numericLimit = typeof limit === 'number' ? limit : undefined
    const from = shouldPaginate ? (page - 1) * (numericLimit as number) : undefined
    const to = shouldPaginate && numericLimit ? from! + numericLimit - 1 : undefined

    let query = supabase.from('faqs').select('*', { count: 'exact' })

    if (category) {
      query = query.eq('category', category)
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
      console.error('Error fetching faqs:', error)
      throw new Error('Failed to fetch faqs')
    }

    const totalCount = shouldPaginate && typeof count === 'number' ? count : count ?? data?.length ?? 0
    const calculatedPages = shouldPaginate && numericLimit ? Math.ceil(totalCount / numericLimit) : 1

    return {
      faqs: (data || []) as FAQ[],
      totalCount,
      totalPages: Math.max(1, calculatedPages),
      currentPage: shouldPaginate ? page : 1,
    }
  },

  async findById(id: string): Promise<FAQ | null> {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching faq:', error)
      return null
    }

    return data as FAQ
  },

  async create(faqData: CreateFAQData): Promise<FAQ> {
    const { data, error } = await supabase
      .from('faqs')
      .insert(faqData)
      .select()
      .single()

    if (error) {
      console.error('Error creating faq:', error)
      throw new Error('Failed to create faq')
    }

    return data as FAQ
  },

  async update(id: string, updateData: UpdateFAQData): Promise<FAQ> {
    const { data, error } = await supabase
      .from('faqs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating faq:', error)
      throw new Error('Failed to update faq')
    }

    return data as FAQ
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('faqs').delete().eq('id', id)

    if (error) {
      console.error('Error deleting faq:', error)
      throw new Error('Failed to delete faq')
    }
  },

  async toggleActive(id: string, isActive: boolean): Promise<FAQ> {
    const { data, error } = await supabase
      .from('faqs')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling faq active:', error)
      throw new Error('Failed to toggle faq active')
    }

    return data as FAQ
  },

  async updateOrder(faqs: { id: string; display_order: number }[]): Promise<void> {
    for (const faq of faqs) {
      const { error } = await supabase
        .from('faqs')
        .update({ display_order: faq.display_order, updated_at: new Date().toISOString() })
        .eq('id', faq.id)

      if (error) {
        console.error('Error updating faq order:', error)
        throw new Error('Failed to update faq order')
      }
    }
  },
}
