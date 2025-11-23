'use server'

import { supabaseServer } from '@/lib/supabase-server'

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { error: 'No file provided' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabaseServer.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseServer.storage
      .from('product-images')
      .getPublicUrl(data.path)

    return { url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { error: 'Failed to upload image' }
  }
}

export async function deleteImage(url: string) {
  try {
    // Extract file path from URL
    const urlObj = new URL(url)
    const path = urlObj.pathname.split('/product-images/')[1]

    if (!path) {
      return { error: 'Invalid image URL' }
    }

    const { error } = await supabaseServer.storage
      .from('product-images')
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { error: 'Failed to delete image' }
  }
}
