'use server'

import { revalidatePath } from 'next/cache'
import { mainBannersRepository, productBannersRepository } from '@/repositories/banners.repository'
import { BannerFilters, CreateBannerData, UpdateBannerData, BannerType } from '@/types/banners.types'

// ==================== 메인 배너 ====================

export async function fetchMainBanners(filters: BannerFilters = {}) {
  return mainBannersRepository.findMany(filters)
}

export async function fetchMainBanner(id: string) {
  return mainBannersRepository.findById(id)
}

export async function createMainBanner(data: CreateBannerData) {
  const result = await mainBannersRepository.create(data)
  revalidatePath('/dashboard/banners')
  return result
}

export async function updateMainBanner(id: string, data: UpdateBannerData) {
  const result = await mainBannersRepository.update(id, data)
  revalidatePath('/dashboard/banners')
  return result
}

export async function deleteMainBanner(id: string) {
  await mainBannersRepository.delete(id)
  revalidatePath('/dashboard/banners')
}

export async function toggleMainBannerActive(id: string, isActive: boolean) {
  const result = await mainBannersRepository.toggleActive(id, isActive)
  revalidatePath('/dashboard/banners')
  return result
}

export async function updateMainBannerOrder(banners: { id: string; display_order: number }[]) {
  await mainBannersRepository.updateOrder(banners)
  revalidatePath('/dashboard/banners')
}

// ==================== 상품 배너 ====================

export async function fetchProductBanners(filters: BannerFilters = {}) {
  return productBannersRepository.findMany(filters)
}

export async function fetchProductBanner(id: string) {
  return productBannersRepository.findById(id)
}

export async function createProductBanner(data: CreateBannerData) {
  const result = await productBannersRepository.create(data)
  revalidatePath('/dashboard/banners')
  return result
}

export async function updateProductBanner(id: string, data: UpdateBannerData) {
  const result = await productBannersRepository.update(id, data)
  revalidatePath('/dashboard/banners')
  return result
}

export async function deleteProductBanner(id: string) {
  await productBannersRepository.delete(id)
  revalidatePath('/dashboard/banners')
}

export async function toggleProductBannerActive(id: string, isActive: boolean) {
  const result = await productBannersRepository.toggleActive(id, isActive)
  revalidatePath('/dashboard/banners')
  return result
}

export async function updateProductBannerOrder(banners: { id: string; display_order: number }[]) {
  await productBannersRepository.updateOrder(banners)
  revalidatePath('/dashboard/banners')
}
