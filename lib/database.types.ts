export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          password_hash: string
          role: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          password_hash: string
          role?: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          password_hash?: string
          role?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_products: {
        Row: {
          coupon_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_products_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupon_applicable_products"
            referencedColumns: ["coupon_id"]
          },
          {
            foreignKeyName: "coupon_products_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "coupon_applicable_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "coupon_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_purchase: number | null
          name: string
          updated_at: string | null
          usage_limit: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          name: string
          updated_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_purchase?: number | null
          name?: string
          updated_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      mountain_zipcodes: {
        Row: {
          additional_fee: number
          created_at: string | null
          id: string
          region_name: string
          region_type: string
          zipcode: string
        }
        Insert: {
          additional_fee: number
          created_at?: string | null
          id?: string
          region_name: string
          region_type: string
          zipcode: string
        }
        Update: {
          additional_fee?: number
          created_at?: string | null
          id?: string
          region_name?: string
          region_type?: string
          zipcode?: string
        }
        Relationships: []
      }
      order_health_consultation: {
        Row: {
          alcohol_frequency: string
          bedtime: string
          created_at: string | null
          current_height: number
          current_weight: number
          diet_approach: string
          has_daytime_sleepiness: boolean
          has_shift_work: boolean
          id: string
          max_weight_since_20s: number
          meal_pattern: string
          medical_history: string
          min_weight_since_20s: number
          name: string
          occupation: string
          order_id: string
          phone: string
          preferred_stage: string
          previous_herbal_medicine: string
          previous_other_medicine: string
          previous_western_medicine: string
          resident_number: string
          target_weight: number
          target_weight_loss_period: string
          updated_at: string | null
          user_id: string
          wake_up_time: string
          water_intake: string
          work_hours: string
        }
        Insert: {
          alcohol_frequency: string
          bedtime: string
          created_at?: string | null
          current_height: number
          current_weight: number
          diet_approach: string
          has_daytime_sleepiness: boolean
          has_shift_work: boolean
          id?: string
          max_weight_since_20s: number
          meal_pattern: string
          medical_history: string
          min_weight_since_20s: number
          name: string
          occupation: string
          order_id: string
          phone: string
          preferred_stage: string
          previous_herbal_medicine: string
          previous_other_medicine: string
          previous_western_medicine: string
          resident_number: string
          target_weight: number
          target_weight_loss_period: string
          updated_at?: string | null
          user_id: string
          wake_up_time: string
          water_intake: string
          work_hours: string
        }
        Update: {
          alcohol_frequency?: string
          bedtime?: string
          created_at?: string | null
          current_height?: number
          current_weight?: number
          diet_approach?: string
          has_daytime_sleepiness?: boolean
          has_shift_work?: boolean
          id?: string
          max_weight_since_20s?: number
          meal_pattern?: string
          medical_history?: string
          min_weight_since_20s?: number
          name?: string
          occupation?: string
          order_id?: string
          phone?: string
          preferred_stage?: string
          previous_herbal_medicine?: string
          previous_other_medicine?: string
          previous_western_medicine?: string
          resident_number?: string
          target_weight?: number
          target_weight_loss_period?: string
          updated_at?: string | null
          user_id?: string
          wake_up_time?: string
          water_intake?: string
          work_hours?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_health_consultation_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          option_id: string | null
          option_name: string | null
          order_id: string | null
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          selected_addons: Json | null
          selected_option_settings: Json | null
          visit_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id?: string | null
          option_name?: string | null
          order_id?: string | null
          product_id?: string | null
          product_name: string
          product_price: number
          quantity: number
          selected_addons?: Json | null
          selected_option_settings?: Json | null
          visit_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string | null
          option_name?: string | null
          order_id?: string | null
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          selected_addons?: Json | null
          selected_option_settings?: Json | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_group_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "coupon_applicable_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_memo: string | null
          assigned_admin_id: string | null
          consultation_status: string
          coupon_discount: number | null
          created_at: string | null
          delivered_at: string | null
          handled_at: string | null
          handler_admin_id: string | null
          id: string
          order_id: string
          order_memo: string | null
          payment_key: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_address_detail: string | null
          shipping_address_id: string | null
          shipping_company: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          status: string
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
          used_points: number | null
          user_coupon_id: string | null
          user_email: string
          user_id: string | null
          user_name: string
          user_phone: string | null
        }
        Insert: {
          admin_memo?: string | null
          assigned_admin_id?: string | null
          consultation_status?: string
          coupon_discount?: number | null
          created_at?: string | null
          delivered_at?: string | null
          handled_at?: string | null
          handler_admin_id?: string | null
          id?: string
          order_id: string
          order_memo?: string | null
          payment_key?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_address_detail?: string | null
          shipping_address_id?: string | null
          shipping_company?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: string
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
          used_points?: number | null
          user_coupon_id?: string | null
          user_email: string
          user_id?: string | null
          user_name: string
          user_phone?: string | null
        }
        Update: {
          admin_memo?: string | null
          assigned_admin_id?: string | null
          consultation_status?: string
          coupon_discount?: number | null
          created_at?: string | null
          delivered_at?: string | null
          handled_at?: string | null
          handler_admin_id?: string | null
          id?: string
          order_id?: string
          order_memo?: string | null
          payment_key?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_address_detail?: string | null
          shipping_address_id?: string | null
          shipping_company?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          status?: string
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
          used_points?: number | null
          user_coupon_id?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_handler_admin_id_fkey"
            columns: ["handler_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "shipping_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_coupon_id_fkey"
            columns: ["user_coupon_id"]
            isOneToOne: false
            referencedRelation: "user_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otps: {
        Row: {
          attempts: number | null
          created_at: string | null
          expires_at: string
          id: string
          otp_hash: string
          phone: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          otp_hash: string
          phone: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_hash?: string
          phone?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      point_history: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          points: number
          reason: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          points: number
          reason: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          points?: number
          reason?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_addons: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_available: boolean | null
          name: string
          price: number
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_available?: boolean | null
          name: string
          price?: number
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_available?: boolean | null
          name?: string
          price?: number
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "coupon_applicable_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_setting_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          setting_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          setting_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          setting_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_group_types_option_id_fkey"
            columns: ["setting_id"]
            isOneToOne: false
            referencedRelation: "product_option_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_settings: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          name: string
          option_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          name: string
          option_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          name?: string
          option_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_group_options_group_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          detail_images: Json | null
          display_order: number | null
          id: string
          image_url: string | null
          is_new_badge: boolean | null
          is_sale_badge: boolean | null
          is_visible: boolean | null
          name: string
          price: number
          product_id: string | null
          slug: string | null
          updated_at: string | null
          use_settings_on_first: boolean
          use_settings_on_revisit_no_consult: boolean
          use_settings_on_revisit_with_consult: boolean
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          detail_images?: Json | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_new_badge?: boolean | null
          is_sale_badge?: boolean | null
          is_visible?: boolean | null
          name: string
          price: number
          product_id?: string | null
          slug?: string | null
          updated_at?: string | null
          use_settings_on_first?: boolean
          use_settings_on_revisit_no_consult?: boolean
          use_settings_on_revisit_with_consult?: boolean
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          detail_images?: Json | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_new_badge?: boolean | null
          is_sale_badge?: boolean | null
          is_visible?: boolean | null
          name?: string
          price?: number
          product_id?: string | null
          slug?: string | null
          updated_at?: string | null
          use_settings_on_first?: boolean
          use_settings_on_revisit_no_consult?: boolean
          use_settings_on_revisit_with_consult?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "coupon_applicable_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          detail_images: Json | null
          discount_rate: number | null
          id: string
          image_url: string | null
          is_new_badge: boolean | null
          is_out_of_stock: boolean | null
          is_sale_badge: boolean | null
          is_visible_on_main: boolean | null
          name: string
          price: number
          sale_end_at: string | null
          sale_start_at: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          detail_images?: Json | null
          discount_rate?: number | null
          id?: string
          image_url?: string | null
          is_new_badge?: boolean | null
          is_out_of_stock?: boolean | null
          is_sale_badge?: boolean | null
          is_visible_on_main?: boolean | null
          name: string
          price: number
          sale_end_at?: string | null
          sale_start_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          detail_images?: Json | null
          discount_rate?: number | null
          id?: string
          image_url?: string | null
          is_new_badge?: boolean | null
          is_out_of_stock?: boolean | null
          is_sale_badge?: boolean | null
          is_visible_on_main?: boolean | null
          name?: string
          price?: number
          sale_end_at?: string | null
          sale_start_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shipping_addresses: {
        Row: {
          address: string
          address_detail: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          phone: string
          postal_code: string | null
          recipient: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          address_detail?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          phone: string
          postal_code?: string | null
          recipient: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          address_detail?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          phone?: string
          postal_code?: string | null
          recipient?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shipping_settings: {
        Row: {
          base_shipping_fee: number
          created_at: string | null
          free_shipping_threshold: number
          id: string
          is_active: boolean
          jeju_additional_fee: number
          mountain_additional_fee: number
          updated_at: string | null
        }
        Insert: {
          base_shipping_fee?: number
          created_at?: string | null
          free_shipping_threshold?: number
          id?: string
          is_active?: boolean
          jeju_additional_fee?: number
          mountain_additional_fee?: number
          updated_at?: string | null
        }
        Update: {
          base_shipping_fee?: number
          created_at?: string | null
          free_shipping_threshold?: number
          id?: string
          is_active?: boolean
          jeju_additional_fee?: number
          mountain_additional_fee?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_coupons: {
        Row: {
          coupon_id: string | null
          created_at: string | null
          id: string
          is_used: boolean | null
          order_id: string | null
          updated_at: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          order_id?: string | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          order_id?: string | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupon_applicable_products"
            referencedColumns: ["coupon_id"]
          },
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_health_consultations: {
        Row: {
          alcohol_frequency: string
          bedtime: string
          created_at: string | null
          current_height: number
          current_weight: number
          diet_approach: string
          has_daytime_sleepiness: boolean
          has_shift_work: boolean
          id: string
          max_weight_since_20s: number
          meal_pattern: string
          medical_history: string
          min_weight_since_20s: number
          name: string
          occupation: string
          phone: string
          preferred_stage: string
          previous_herbal_medicine: string
          previous_other_medicine: string
          previous_western_medicine: string
          resident_number: string
          target_weight: number
          target_weight_loss_period: string
          updated_at: string | null
          user_id: string
          wake_up_time: string
          water_intake: string
          work_hours: string
        }
        Insert: {
          alcohol_frequency: string
          bedtime: string
          created_at?: string | null
          current_height: number
          current_weight: number
          diet_approach: string
          has_daytime_sleepiness: boolean
          has_shift_work: boolean
          id?: string
          max_weight_since_20s: number
          meal_pattern: string
          medical_history: string
          min_weight_since_20s: number
          name: string
          occupation: string
          phone: string
          preferred_stage: string
          previous_herbal_medicine: string
          previous_other_medicine: string
          previous_western_medicine: string
          resident_number: string
          target_weight: number
          target_weight_loss_period: string
          updated_at?: string | null
          user_id: string
          wake_up_time: string
          water_intake: string
          work_hours: string
        }
        Update: {
          alcohol_frequency?: string
          bedtime?: string
          created_at?: string | null
          current_height?: number
          current_weight?: number
          diet_approach?: string
          has_daytime_sleepiness?: boolean
          has_shift_work?: boolean
          id?: string
          max_weight_since_20s?: number
          meal_pattern?: string
          medical_history?: string
          min_weight_since_20s?: number
          name?: string
          occupation?: string
          phone?: string
          preferred_stage?: string
          previous_herbal_medicine?: string
          previous_other_medicine?: string
          previous_western_medicine?: string
          resident_number?: string
          target_weight?: number
          target_weight_loss_period?: string
          updated_at?: string | null
          user_id?: string
          wake_up_time?: string
          water_intake?: string
          work_hours?: string
        }
        Relationships: []
      }
      user_health_profiles: {
        Row: {
          allergies: string | null
          birth_date: string | null
          constitution_type: string | null
          created_at: string | null
          family_history: string | null
          gender: string | null
          health_conditions: Json | null
          height: number | null
          id: string
          medical_history: string | null
          medications: string | null
          notes: string | null
          pulse_diagnosis: string | null
          symptoms: Json | null
          tongue_diagnosis: string | null
          updated_at: string | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          allergies?: string | null
          birth_date?: string | null
          constitution_type?: string | null
          created_at?: string | null
          family_history?: string | null
          gender?: string | null
          health_conditions?: Json | null
          height?: number | null
          id?: string
          medical_history?: string | null
          medications?: string | null
          notes?: string | null
          pulse_diagnosis?: string | null
          symptoms?: Json | null
          tongue_diagnosis?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          allergies?: string | null
          birth_date?: string | null
          constitution_type?: string | null
          created_at?: string | null
          family_history?: string | null
          gender?: string | null
          health_conditions?: Json | null
          height?: number | null
          id?: string
          medical_history?: string | null
          medications?: string | null
          notes?: string | null
          pulse_diagnosis?: string | null
          symptoms?: Json | null
          tongue_diagnosis?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          points: number | null
          total_earned: number | null
          total_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          points?: number | null
          total_earned?: number | null
          total_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number | null
          total_earned?: number | null
          total_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          phone: string | null
          phone_verified: boolean | null
          phone_verified_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          phone_verified_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "coupon_applicable_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      coupon_applicable_products: {
        Row: {
          code: string | null
          coupon_id: string | null
          coupon_name: string | null
          image_url: string | null
          price: number | null
          product_id: string | null
          product_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_points: {
        Args: {
          p_order_id?: string
          p_points: number
          p_reason: string
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_shipping_fee: {
        Args: { p_order_amount: number; p_zipcode?: string }
        Returns: {
          base_fee: number
          is_free_shipping: boolean
          region_type: string
          regional_fee: number
          total_fee: number
        }[]
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      expire_pending_orders: {
        Args: never
        Returns: {
          expired_count: number
        }[]
      }
      generate_product_slug: { Args: never; Returns: string }
      get_group_price: { Args: { p_group_id: string }; Returns: number }
      get_group_use_options: {
        Args: { p_group_id: string; p_visit_type: string }
        Returns: boolean
      }
      get_latest_otp: {
        Args: { p_phone: string }
        Returns: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          phone: string
          verified: boolean
        }[]
      }
      get_user_by_phone: {
        Args: { p_phone: string }
        Returns: {
          display_name: string
          email: string
          id: string
          phone: string
          phone_verified: boolean
          user_id: string
        }[]
      }
      is_coupon_applicable_to_product: {
        Args: { p_coupon_id: string; p_product_id: string }
        Returns: boolean
      }
      use_points: {
        Args: {
          p_order_id?: string
          p_points: number
          p_reason: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
