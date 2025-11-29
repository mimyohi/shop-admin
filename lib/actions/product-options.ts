'use server'

import { productOptionsRepository } from '@/repositories/product-options.repository'
import { supabaseServer } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fetchProductConfiguration(productId: string) {
  return productOptionsRepository.findConfigurationByProductId(productId)
}

export async function fetchUnlinkedOptions() {
  try {
    const options = await productOptionsRepository.findUnlinkedOptions()
    return { success: true, data: options }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function fetchOptionsByProductId(productId: string) {
  try {
    const options = await productOptionsRepository.findByProductId(productId)
    return { success: true, data: options }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function linkOptionToProduct(optionId: string, productId: string) {
  try {
    await productOptionsRepository.linkToProduct(optionId, productId)
    revalidatePath(`/dashboard/products/${productId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function unlinkOptionFromProduct(optionId: string, productId: string) {
  try {
    await productOptionsRepository.unlinkFromProduct(optionId)
    revalidatePath(`/dashboard/products/${productId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function fetchOptionSettingsWithTypes(optionId: string) {
  try {
    const { data, error } = await supabaseServer
      .from('product_option_settings')
      .select(
        `
        *,
        product_option_setting_types (*)
      `
      )
      .eq('option_id', optionId)
      .order('display_order')

    if (error) throw error

    const formattedSettings = (data || []).map((setting: any) => ({
      ...setting,
      types: setting.product_option_setting_types || [],
    }))

    return { success: true, data: formattedSettings }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ProductOption CRUD ===
export async function createProductOption(productId: string, data: any) {
  try {
    const { data: option, error } = await supabaseServer
      .from('product_options')
      .insert({
        product_id: productId,
        name: data.name,
        price: data.price,
        image_url: data.image_url,
        use_settings_on_first: data.use_settings_on_first ?? false,
        use_settings_on_revisit_with_consult: data.use_settings_on_revisit_with_consult ?? false,
        use_settings_on_revisit_no_consult: data.use_settings_on_revisit_no_consult ?? false,
        display_order: data.display_order ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/products/${productId}`)
    return { success: true, data: option }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateProductOption(optionId: string, data: any) {
  try {
    const { data: option, error } = await supabaseServer
      .from('product_options')
      .update(data)
      .eq('id', optionId)
      .select()
      .single()

    if (error) throw error

    // Revalidate the product page if we have product_id
    if (option.product_id) {
      revalidatePath(`/dashboard/products/${option.product_id}`)
    }

    return { success: true, data: option }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteProductOption(optionId: string) {
  try {
    // First get the option to get product_id for revalidation
    const { data: option } = await supabaseServer
      .from('product_options')
      .select('product_id')
      .eq('id', optionId)
      .single()

    // Delete associated settings and types (cascade should handle this, but explicit is safer)
    await supabaseServer
      .from('product_option_settings')
      .delete()
      .eq('option_id', optionId)

    // Delete the option
    const { error } = await supabaseServer
      .from('product_options')
      .delete()
      .eq('id', optionId)

    if (error) throw error

    if (option?.product_id) {
      revalidatePath(`/dashboard/products/${option.product_id}`)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ProductOptionSetting CRUD ===
export async function createProductOptionSetting(optionId: string, data: any) {
  try {
    const { data: setting, error } = await supabaseServer
      .from('product_option_settings')
      .insert({
        option_id: optionId,
        name: data.name,
        display_order: data.display_order ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data: setting }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateProductOptionSetting(settingId: string, data: any) {
  try {
    const { data: setting, error } = await supabaseServer
      .from('product_option_settings')
      .update(data)
      .eq('id', settingId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: setting }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteProductOptionSetting(settingId: string) {
  try {
    // Delete associated types first
    await supabaseServer
      .from('product_option_setting_types')
      .delete()
      .eq('setting_id', settingId)

    const { error } = await supabaseServer
      .from('product_option_settings')
      .delete()
      .eq('id', settingId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ProductOptionSettingType CRUD ===
export async function createProductOptionSettingType(settingId: string, data: any) {
  try {
    const { data: type, error } = await supabaseServer
      .from('product_option_setting_types')
      .insert({
        setting_id: settingId,
        name: data.name,
        display_order: data.display_order ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data: type }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateProductOptionSettingType(typeId: string, data: any) {
  try {
    const { data: type, error } = await supabaseServer
      .from('product_option_setting_types')
      .update(data)
      .eq('id', typeId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data: type }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteProductOptionSettingType(typeId: string) {
  try {
    const { error } = await supabaseServer
      .from('product_option_setting_types')
      .delete()
      .eq('id', typeId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
