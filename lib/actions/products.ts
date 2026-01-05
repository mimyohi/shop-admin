'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { productOptionsRepository } from '@/repositories/product-options.repository'
import { productsRepository } from '@/repositories/products.repository'
import { CreateProductData, ProductFilters, UpdateProductData } from '@/types/products.types'
import type { ProductOption, ProductAddon } from '@/models'

export async function fetchProducts(filters: ProductFilters = {}) {
  return productsRepository.findMany(filters)
}

export async function fetchProduct(id: string) {
  return productsRepository.findById(id)
}

export async function fetchProductCategories() {
  return productsRepository.findCategories()
}

export async function fetchProductOptions(productId: string): Promise<ProductOption[]> {
  return productOptionsRepository.findByProductId(productId)
}

export async function fetchProductAddons(productId: string): Promise<ProductAddon[]> {
  return productOptionsRepository.findAddonsByProductId(productId)
}

export async function createProduct(data: CreateProductData) {
  const result = await productsRepository.create(data)
  revalidatePath('/dashboard/products')
  return result
}

export async function createProductWithOptions(data: {
  product: any
  options: any[]
  addons: any[]
}) {
  // 1. 상품 생성
  const { data: newProduct, error: productError } = await supabaseServer
    .from('products')
    .insert([data.product])
    .select()
    .single()

  if (productError) throw productError

  try {
    // 2. 모든 옵션 배치 삽입
    if (data.options.length > 0) {
      const optionsData = data.options.map((option: any) => ({
        product_id: newProduct.id,
        name: option.name,
        price: option.price,
        discount_rate: option.discount_rate ?? 0,
        is_representative: option.is_representative ?? false,
        use_settings_on_first: option.use_settings_on_first ?? false,
        use_settings_on_revisit_with_consult: option.use_settings_on_revisit_with_consult ?? false,
        use_settings_on_revisit_no_consult: option.use_settings_on_revisit_no_consult ?? false,
        display_order: option.display_order,
      }))

      const { data: newOptions, error: optionError } = await supabaseServer
        .from('product_options')
        .insert(optionsData)
        .select()

      if (optionError) throw optionError

      // 3. 모든 Settings 배치 삽입
      const allSettingsData: any[] = []
      const optionSettingsMap: Map<number, { optionIdx: number; settings: any[] }> = new Map()

      data.options.forEach((option: any, optionIdx: number) => {
        if (option.settings && option.settings.length > 0) {
          const newOptionId = newOptions[optionIdx].id
          option.settings.forEach((setting: any) => {
            allSettingsData.push({
              option_id: newOptionId,
              name: setting.name,
              display_order: setting.display_order,
              _temp_option_idx: optionIdx,
              _temp_setting_types: setting.types || [],
            })
          })
        }
      })

      if (allSettingsData.length > 0) {
        // 임시 필드 제거 후 삽입
        const settingsToInsert = allSettingsData.map(({ _temp_option_idx, _temp_setting_types, ...rest }) => rest)

        const { data: newSettings, error: settingError } = await supabaseServer
          .from('product_option_settings')
          .insert(settingsToInsert)
          .select()

        if (settingError) throw settingError

        // 4. 모든 Setting Types 배치 삽입
        const allTypesData: any[] = []
        newSettings.forEach((newSetting: any, idx: number) => {
          const types = allSettingsData[idx]._temp_setting_types
          if (types && types.length > 0) {
            types.forEach((type: any) => {
              allTypesData.push({
                setting_id: newSetting.id,
                name: type.name,
                display_order: type.display_order,
              })
            })
          }
        })

        if (allTypesData.length > 0) {
          const { error: typesError } = await supabaseServer
            .from('product_option_setting_types')
            .insert(allTypesData)

          if (typesError) throw typesError
        }
      }
    }

    // 5. 추가상품 배치 삽입
    if (data.addons.length > 0) {
      const addonData = data.addons.map((addon: any) => ({
        product_id: newProduct.id,
        name: addon.name,
        description: addon.description,
        price: addon.price,
        image_url: addon.image_url || null,
        is_available: addon.is_available,
        display_order: addon.display_order,
      }))

      const { error: addonsError } = await supabaseServer
        .from('product_addons')
        .insert(addonData)

      if (addonsError) throw addonsError
    }

    revalidatePath('/dashboard/products')
    return newProduct
  } catch (error) {
    // 실패 시 생성된 상품 삭제 (롤백)
    await supabaseServer.from('products').delete().eq('id', newProduct.id)
    throw error
  }
}

export async function updateProduct(id: string, data: UpdateProductData) {
  const result = await productsRepository.update(id, data)
  revalidatePath('/dashboard/products')
  revalidatePath(`/dashboard/products/${id}`)
  return result
}

export async function deleteProduct(id: string) {
  const result = await productsRepository.delete(id)
  revalidatePath('/dashboard/products')
  return result
}

export async function toggleProductVisibility(id: string, isVisible: boolean) {
  const result = await productsRepository.update(id, { is_visible_on_main: isVisible })
  revalidatePath('/dashboard/products')
  return result
}

export async function toggleProductOutOfStock(id: string, isOutOfStock: boolean) {
  const result = await productsRepository.toggleOutOfStock(id, isOutOfStock)
  revalidatePath('/dashboard/products')
  revalidatePath(`/dashboard/products/${id}`)
  return result
}

export async function toggleProductNewBadge(id: string, isNewBadge: boolean) {
  const result = await productsRepository.toggleNewBadge(id, isNewBadge)
  revalidatePath('/dashboard/products')
  revalidatePath(`/dashboard/products/${id}`)
  return result
}

export async function toggleProductSaleBadge(id: string, isSaleBadge: boolean) {
  const result = await productsRepository.toggleSaleBadge(id, isSaleBadge)
  revalidatePath('/dashboard/products')
  revalidatePath(`/dashboard/products/${id}`)
  return result
}

export async function duplicateProduct(id: string) {
  const result = await productsRepository.duplicate(id)
  revalidatePath('/dashboard/products')
  return result
}

export async function updateProductWithOptions(data: {
  productId: string
  product: any
  options: any[]
  addons: any[]
}) {
  // 1. 상품 업데이트
  const updatedProduct = await productsRepository.update(data.productId, data.product)

  // 2. 기존 옵션 조회 (활성 옵션만)
  const { data: existingOptions } = await supabaseServer
    .from('product_options')
    .select('id')
    .eq('product_id', data.productId)
    .is('deleted_at', null)

  const existingOptionIds = new Set(existingOptions?.map(opt => opt.id) || [])
  const newOptionIds = new Set(data.options.map(opt => opt.id).filter(Boolean))

  // 3. 삭제된 옵션 찾기 (기존에는 있었지만 새로운 데이터에는 없는 것)
  const deletedOptionIds = [...existingOptionIds].filter(id => !newOptionIds.has(id))

  // 4. 삭제된 옵션 soft delete 처리
  if (deletedOptionIds.length > 0) {
    await supabaseServer
      .from('product_options')
      .update({ deleted_at: new Date().toISOString() } as any)
      .in('id', deletedOptionIds)
  }

  // 5. 옵션 UPDATE 또는 INSERT
  for (const option of data.options) {
    if (option.id && existingOptionIds.has(option.id)) {
      // 기존 옵션 UPDATE
      await supabaseServer
        .from('product_options')
        .update({
          name: option.name,
          price: option.price,
          discount_rate: option.discount_rate ?? 0,
          is_representative: option.is_representative ?? false,
          use_settings_on_first: option.use_settings_on_first ?? false,
          use_settings_on_revisit_with_consult: option.use_settings_on_revisit_with_consult ?? false,
          use_settings_on_revisit_no_consult: option.use_settings_on_revisit_no_consult ?? false,
          display_order: option.display_order,
        })
        .eq('id', option.id)

      // Settings도 업데이트 (간단하게 하기 위해 삭제 후 재생성)
      // 기존 settings 삭제
      const { data: existingSettings } = await supabaseServer
        .from('product_option_settings')
        .select('id')
        .eq('option_id', option.id)

      if (existingSettings && existingSettings.length > 0) {
        const settingIds = existingSettings.map(s => s.id)
        await supabaseServer
          .from('product_option_setting_types')
          .delete()
          .in('setting_id', settingIds)
        await supabaseServer
          .from('product_option_settings')
          .delete()
          .eq('option_id', option.id)
      }
    } else {
      // 새로운 옵션 INSERT
      const { data: newOption, error: optionError } = await supabaseServer
        .from('product_options')
        .insert({
          product_id: data.productId,
          name: option.name,
          price: option.price,
          discount_rate: option.discount_rate ?? 0,
          is_representative: option.is_representative ?? false,
          use_settings_on_first: option.use_settings_on_first ?? false,
          use_settings_on_revisit_with_consult: option.use_settings_on_revisit_with_consult ?? false,
          use_settings_on_revisit_no_consult: option.use_settings_on_revisit_no_consult ?? false,
          display_order: option.display_order,
        })
        .select('id')
        .single()

      if (optionError) throw optionError
      option.id = newOption.id
    }

    // 6. Settings 재생성
    if (option.settings && option.settings.length > 0) {
      const settingsData = option.settings.map((setting: any) => ({
        option_id: option.id,
        name: setting.name,
        display_order: setting.display_order,
      }))

      const { data: newSettings, error: settingError } = await supabaseServer
        .from('product_option_settings')
        .insert(settingsData)
        .select()

      if (settingError) throw settingError

      // 7. Setting Types 생성
      for (let idx = 0; idx < newSettings.length; idx++) {
        const setting = option.settings[idx]
        const newSetting = newSettings[idx]

        if (setting.types && setting.types.length > 0) {
          const typesData = setting.types.map((type: any) => ({
            setting_id: newSetting.id,
            name: type.name,
            display_order: type.display_order,
          }))

          const { error: typesError } = await supabaseServer
            .from('product_option_setting_types')
            .insert(typesData)

          if (typesError) throw typesError
        }
      }
    }
  }

  // 6. 기존 추가상품 삭제 후 새로 생성
  await supabaseServer
    .from('product_addons')
    .delete()
    .eq('product_id', data.productId)

  // 7. 새 추가상품 배치 저장
  if (data.addons.length > 0) {
    const addonData = data.addons.map((addon: any) => ({
      product_id: data.productId,
      name: addon.name,
      description: addon.description,
      price: addon.price,
      image_url: addon.image_url || null,
      is_available: addon.is_available,
      display_order: addon.display_order,
    }))

    const { error: addonsError } = await supabaseServer
      .from('product_addons')
      .insert(addonData)

    if (addonsError) throw addonsError
  }

  revalidatePath('/dashboard/products')
  revalidatePath(`/dashboard/products/${data.productId}`)
  return updatedProduct
}

// Product Addon Actions
export async function createAddon(productId: string, data: any) {
  try {
    const result = await productOptionsRepository.createAddon(productId, data)
    revalidatePath(`/dashboard/products/${productId}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Create addon error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateAddon(addonId: string, data: any) {
  try {
    const result = await productOptionsRepository.updateAddon(addonId, data)
    revalidatePath('/dashboard/products')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update addon error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteAddon(addonId: string) {
  try {
    await productOptionsRepository.deleteAddon(addonId)
    revalidatePath('/dashboard/products')
    return { success: true }
  } catch (error: any) {
    console.error('Delete addon error:', error)
    return { success: false, error: error.message }
  }
}
