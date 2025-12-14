/**
 * Instagram Image models
 */

export interface InstagramImage {
  id: string
  image_url: string
  link_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
