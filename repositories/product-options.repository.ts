import { supabase } from '@/lib/supabase'
import type { ProductAddon, ProductOption, ProductOptionValue } from '@/models'

export interface ProductConfiguration {
  options: (ProductOption & { values?: ProductOptionValue[] })[]
  addons: ProductAddon[]
}

export const productOptionsRepository = {
  async findOptionsByProductId(productId: string) {
    const { data, error } = await supabase
      .from('product_options')
      .select(
        `
        *,
        product_option_values (*)
      `
      )
      .eq('product_id', productId)
      .order('display_order')

    if (error) {
      console.error('Error fetching product options:', error)
      throw new Error('Failed to fetch product options')
    }

    return (
      data?.map((option) => ({
        ...option,
        values: (option.product_option_values as ProductOptionValue[] | undefined)?.sort(
          (a, b) => a.display_order - b.display_order
        ),
      })) || []
    )
  },

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

  async findConfigurationByProductId(productId: string): Promise<ProductConfiguration> {
    const [options, addons] = await Promise.all([
      this.findOptionsByProductId(productId),
      this.findAddonsByProductId(productId),
    ])

    return { options, addons }
  },
}
