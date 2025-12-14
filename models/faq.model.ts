/**
 * FAQ models
 */

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
