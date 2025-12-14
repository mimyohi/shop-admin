'use server'

import { revalidatePath } from 'next/cache'
import { faqsRepository } from '@/repositories/faqs.repository'
import { FAQFilters, CreateFAQData, UpdateFAQData } from '@/types/faqs.types'

export async function fetchFAQs(filters: FAQFilters = {}) {
  return faqsRepository.findMany(filters)
}

export async function fetchFAQ(id: string) {
  return faqsRepository.findById(id)
}

export async function createFAQ(data: CreateFAQData) {
  const result = await faqsRepository.create(data)
  revalidatePath('/dashboard/faqs')
  return result
}

export async function updateFAQ(id: string, data: UpdateFAQData) {
  const result = await faqsRepository.update(id, data)
  revalidatePath('/dashboard/faqs')
  return result
}

export async function deleteFAQ(id: string) {
  await faqsRepository.delete(id)
  revalidatePath('/dashboard/faqs')
}

export async function toggleFAQActive(id: string, isActive: boolean) {
  const result = await faqsRepository.toggleActive(id, isActive)
  revalidatePath('/dashboard/faqs')
  return result
}

export async function updateFAQOrder(faqs: { id: string; display_order: number }[]) {
  await faqsRepository.updateOrder(faqs)
  revalidatePath('/dashboard/faqs')
}
