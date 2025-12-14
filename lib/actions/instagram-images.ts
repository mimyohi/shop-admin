'use server'

import { revalidatePath } from 'next/cache'
import { instagramImagesRepository } from '@/repositories/instagram-images.repository'
import { InstagramImageFilters, CreateInstagramImageData, UpdateInstagramImageData } from '@/types/instagram-images.types'

export async function fetchInstagramImages(filters: InstagramImageFilters = {}) {
  return instagramImagesRepository.findMany(filters)
}

export async function fetchInstagramImage(id: string) {
  return instagramImagesRepository.findById(id)
}

export async function createInstagramImage(data: CreateInstagramImageData) {
  const result = await instagramImagesRepository.create(data)
  revalidatePath('/dashboard/instagram-images')
  return result
}

export async function updateInstagramImage(id: string, data: UpdateInstagramImageData) {
  const result = await instagramImagesRepository.update(id, data)
  revalidatePath('/dashboard/instagram-images')
  return result
}

export async function deleteInstagramImage(id: string) {
  await instagramImagesRepository.delete(id)
  revalidatePath('/dashboard/instagram-images')
}

export async function toggleInstagramImageActive(id: string, isActive: boolean) {
  const result = await instagramImagesRepository.toggleActive(id, isActive)
  revalidatePath('/dashboard/instagram-images')
  return result
}

export async function updateInstagramImageOrder(images: { id: string; display_order: number }[]) {
  await instagramImagesRepository.updateOrder(images)
  revalidatePath('/dashboard/instagram-images')
}
