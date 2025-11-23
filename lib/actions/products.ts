'use server'

import { productsRepository } from '@/repositories/products.repository'
import { productOptionsRepository } from '@/repositories/product-options.repository'
import { supabaseServer } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createProduct(data: any) {
  try {
    const result = await productsRepository.create(data)
    revalidatePath('/dashboard/products')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Create product error:', error)
    return { success: false, error: error.message }
  }
}

export async function createProductWithOptions(data: {
  product: any
  options: any[]
  addons: any[]
}) {
  try {
    // 1. 상품 생성
    const { data: newProduct, error: productError } = await supabaseServer
      .from('products')
      .insert([data.product])
      .select()
      .single()

    if (productError) throw productError

    // 2. 옵션 저장
    for (const option of data.options) {
      const { data: newOption, error: optionError } = await supabaseServer
        .from('product_options')
        .insert([{
          product_id: newProduct.id,
          name: option.name,
          is_required: option.is_required,
          display_order: option.display_order,
        }])
        .select()
        .single()

      if (optionError) throw optionError

      // 3. 옵션 값 저장
      if (option.values && option.values.length > 0) {
        const optionValues = option.values.map((value: any) => ({
          option_id: newOption.id,
          value: value.value,
          price_adjustment: value.price_adjustment,
          stock: value.stock,
          is_available: value.is_available,
          display_order: value.display_order,
        }))

        const { error: valuesError } = await supabaseServer
          .from('product_option_values')
          .insert(optionValues)

        if (valuesError) throw valuesError
      }
    }

    // 4. 추가상품 저장
    if (data.addons.length > 0) {
      const addonData = data.addons.map((addon: any) => ({
        product_id: newProduct.id,
        name: addon.name,
        description: addon.description,
        price: addon.price,
        stock: addon.stock,
        is_available: addon.is_available,
        display_order: addon.display_order,
      }))

      const { error: addonsError } = await supabaseServer
        .from('product_addons')
        .insert(addonData)

      if (addonsError) throw addonsError
    }

    revalidatePath('/dashboard/products')
    return { success: true, data: newProduct }
  } catch (error: any) {
    console.error('Create product with options error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    const result = await productsRepository.update(id, data)
    revalidatePath('/dashboard/products')
    revalidatePath(`/dashboard/products/${id}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update product error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteProduct(id: string) {
  try {
    await productsRepository.delete(id)
    revalidatePath('/dashboard/products')
    return { success: true }
  } catch (error: any) {
    console.error('Delete product error:', error)
    return { success: false, error: error.message }
  }
}

export async function toggleProductVisibility(id: string, isVisible: boolean) {
  try {
    await productsRepository.update(id, { is_visible_on_main: isVisible })
    revalidatePath('/dashboard/products')
    return { success: true }
  } catch (error: any) {
    console.error('Toggle visibility error:', error)
    return { success: false, error: error.message }
  }
}

// Product Options Actions
export async function createProductOption(productId: string, data: any) {
  try {
    const result = await productOptionsRepository.createOption(productId, data)
    revalidatePath(`/dashboard/products/${productId}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Create option error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateProductOption(optionId: string, data: any) {
  try {
    const result = await productOptionsRepository.updateOption(optionId, data)
    revalidatePath('/dashboard/products')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update option error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteProductOption(optionId: string) {
  try {
    await productOptionsRepository.deleteOption(optionId)
    revalidatePath('/dashboard/products')
    return { success: true }
  } catch (error: any) {
    console.error('Delete option error:', error)
    return { success: false, error: error.message }
  }
}

export async function createOptionValue(optionId: string, data: any) {
  try {
    const result = await productOptionsRepository.createOptionValue(optionId, data)
    revalidatePath('/dashboard/products')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Create option value error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateOptionValue(valueId: string, data: any) {
  try {
    const result = await productOptionsRepository.updateOptionValue(valueId, data)
    revalidatePath('/dashboard/products')
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Update option value error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteOptionValue(valueId: string) {
  try {
    await productOptionsRepository.deleteOptionValue(valueId)
    revalidatePath('/dashboard/products')
    return { success: true }
  } catch (error: any) {
    console.error('Delete option value error:', error)
    return { success: false, error: error.message }
  }
}

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
