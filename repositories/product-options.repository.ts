import { supabaseServer as supabase } from '@/lib/supabase-server'
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

  async createOption(productId: string, data: any): Promise<ProductOption> {
    const { data: option, error } = await supabase
      .from('product_options')
      .insert({
        product_id: productId,
        ...data,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product option:', error)
      throw new Error('Failed to create product option')
    }

    return option
  },

  async updateOption(optionId: string, data: any): Promise<ProductOption> {
    const { data: option, error } = await supabase
      .from('product_options')
      .update(data)
      .eq('id', optionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product option:', error)
      throw new Error('Failed to update product option')
    }

    return option
  },

  async deleteOption(optionId: string): Promise<void> {
    const { error } = await supabase
      .from('product_options')
      .delete()
      .eq('id', optionId)

    if (error) {
      console.error('Error deleting product option:', error)
      throw new Error('Failed to delete product option')
    }
  },

  async createOptionValue(optionId: string, data: any): Promise<ProductOptionValue> {
    const { data: value, error } = await supabase
      .from('product_option_values')
      .insert({
        option_id: optionId,
        ...data,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating option value:', error)
      throw new Error('Failed to create option value')
    }

    return value
  },

  async updateOptionValue(valueId: string, data: any): Promise<ProductOptionValue> {
    const { data: value, error } = await supabase
      .from('product_option_values')
      .update(data)
      .eq('id', valueId)
      .select()
      .single()

    if (error) {
      console.error('Error updating option value:', error)
      throw new Error('Failed to update option value')
    }

    return value
  },

  async deleteOptionValue(valueId: string): Promise<void> {
    const { error } = await supabase
      .from('product_option_values')
      .delete()
      .eq('id', valueId)

    if (error) {
      console.error('Error deleting option value:', error)
      throw new Error('Failed to delete option value')
    }
  },

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
