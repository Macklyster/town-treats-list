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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          auction_max_active_per_store: number
          duty_max_concurrent_default: number
          event_max_active_per_store: number
          flash_default_hours: number
          geo_offer_max_active_per_store: number
          group_offer_max_active_per_store: number
          id: boolean
          offer_approval_sla_hours: number
          offer_min_validity_hours: number
          review_prompt_hours: number
          scheduled_offer_max_lead_days: number
          scheduled_offer_min_lead_hours: number
          social_proof_min_viewers_now: number
          social_proof_min_views_today: number
          social_proof_now_window_minutes: number
          trial_default_days: number
          updated_at: string
        }
        Insert: {
          auction_max_active_per_store?: number
          duty_max_concurrent_default?: number
          event_max_active_per_store?: number
          flash_default_hours?: number
          geo_offer_max_active_per_store?: number
          group_offer_max_active_per_store?: number
          id?: boolean
          offer_approval_sla_hours?: number
          offer_min_validity_hours?: number
          review_prompt_hours?: number
          scheduled_offer_max_lead_days?: number
          scheduled_offer_min_lead_hours?: number
          social_proof_min_viewers_now?: number
          social_proof_min_views_today?: number
          social_proof_now_window_minutes?: number
          trial_default_days?: number
          updated_at?: string
        }
        Update: {
          auction_max_active_per_store?: number
          duty_max_concurrent_default?: number
          event_max_active_per_store?: number
          flash_default_hours?: number
          geo_offer_max_active_per_store?: number
          group_offer_max_active_per_store?: number
          id?: boolean
          offer_approval_sla_hours?: number
          offer_min_validity_hours?: number
          review_prompt_hours?: number
          scheduled_offer_max_lead_days?: number
          scheduled_offer_min_lead_hours?: number
          social_proof_min_viewers_now?: number
          social_proof_min_views_today?: number
          social_proof_now_window_minutes?: number
          trial_default_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      auction_offers: {
        Row: {
          category_slug: string
          conditions: string | null
          created_at: string
          decrement_amount: number
          decrement_interval_minutes: number
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          min_price: number
          reserved_quantity: number
          share_token: string
          starting_price: number
          starts_at: string | null
          status: Database["public"]["Enums"]["auction_status"]
          store_id: string
          title: string
          total_quantity: number
          updated_at: string
        }
        Insert: {
          category_slug: string
          conditions?: string | null
          created_at?: string
          decrement_amount: number
          decrement_interval_minutes?: number
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          min_price: number
          reserved_quantity?: number
          share_token?: string
          starting_price: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["auction_status"]
          store_id: string
          title: string
          total_quantity?: number
          updated_at?: string
        }
        Update: {
          category_slug?: string
          conditions?: string | null
          created_at?: string
          decrement_amount?: number
          decrement_interval_minutes?: number
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          min_price?: number
          reserved_quantity?: number
          share_token?: string
          starting_price?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["auction_status"]
          store_id?: string
          title?: string
          total_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_reservations: {
        Row: {
          auction_id: string
          id: string
          reserved_at: string
          reserved_price: number
          user_id: string
          whatsapp_clicked_at: string | null
        }
        Insert: {
          auction_id: string
          id?: string
          reserved_at?: string
          reserved_price: number
          user_id: string
          whatsapp_clicked_at?: string | null
        }
        Update: {
          auction_id?: string
          id?: string
          reserved_at?: string
          reserved_price?: number
          user_id?: string
          whatsapp_clicked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_reservations_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auction_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_reasons: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          store_id: string
          subscription_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          store_id: string
          subscription_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          store_id?: string
          subscription_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      company_flyscore: {
        Row: {
          overall: number
          pilares: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          overall?: number
          pilares?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          overall?: number
          pilares?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_flyscore_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          redeemed_at: string | null
          unique_code: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          redeemed_at?: string | null
          unique_code?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          redeemed_at?: string | null
          unique_code?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string | null
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id: string
          kind: Database["public"]["Enums"]["coupon_kind"]
          max_per_user: number
          max_uses: number | null
          offer_id: string | null
          store_id: string
          title: string
          updated_at: string
          uses_count: number
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          code?: string | null
          created_at?: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id?: string
          kind?: Database["public"]["Enums"]["coupon_kind"]
          max_per_user?: number
          max_uses?: number | null
          offer_id?: string | null
          store_id: string
          title: string
          updated_at?: string
          uses_count?: number
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          code?: string | null
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          kind?: Database["public"]["Enums"]["coupon_kind"]
          max_per_user?: number
          max_uses?: number | null
          offer_id?: string | null
          store_id?: string
          title?: string
          updated_at?: string
          uses_count?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      duty_category_limits: {
        Row: {
          category_slug: string
          max_concurrent: number
          updated_at: string
        }
        Insert: {
          category_slug: string
          max_concurrent?: number
          updated_at?: string
        }
        Update: {
          category_slug?: string
          max_concurrent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duty_category_limits_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          approved_at: string | null
          category_slug: string | null
          city: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          featured: boolean
          gallery: Json
          id: string
          image_url: string | null
          kind: Database["public"]["Enums"]["event_kind"]
          latitude: number | null
          link_url: string | null
          longitude: number | null
          price_info: string | null
          rejection_reason: string | null
          share_token: string
          slug: string
          starts_at: string
          state: string
          status: Database["public"]["Enums"]["event_status"]
          store_id: string | null
          title: string
          updated_at: string
          venue: string | null
          view_count: number
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          category_slug?: string | null
          city: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          featured?: boolean
          gallery?: Json
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["event_kind"]
          latitude?: number | null
          link_url?: string | null
          longitude?: number | null
          price_info?: string | null
          rejection_reason?: string | null
          share_token?: string
          slug: string
          starts_at: string
          state: string
          status?: Database["public"]["Enums"]["event_status"]
          store_id?: string | null
          title: string
          updated_at?: string
          venue?: string | null
          view_count?: number
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          category_slug?: string | null
          city?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          featured?: boolean
          gallery?: Json
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["event_kind"]
          latitude?: number | null
          link_url?: string | null
          longitude?: number | null
          price_info?: string | null
          rejection_reason?: string | null
          share_token?: string
          slug?: string
          starts_at?: string
          state?: string
          status?: Database["public"]["Enums"]["event_status"]
          store_id?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      geo_offer_visits: {
        Row: {
          entered_at: string
          geo_offer_id: string
          id: string
          notified_at: string | null
          session_id: string | null
          user_id: string | null
          visit_date: string
        }
        Insert: {
          entered_at?: string
          geo_offer_id: string
          id?: string
          notified_at?: string | null
          session_id?: string | null
          user_id?: string | null
          visit_date?: string
        }
        Update: {
          entered_at?: string
          geo_offer_id?: string
          id?: string
          notified_at?: string | null
          session_id?: string | null
          user_id?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_offer_visits_geo_offer_id_fkey"
            columns: ["geo_offer_id"]
            isOneToOne: false
            referencedRelation: "geo_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_offers: {
        Row: {
          category_slug: string
          center_lat: number
          center_lng: number
          conditions: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          original_price: number
          promo_price: number
          radius_meters: number
          share_token: string
          status: Database["public"]["Enums"]["geo_offer_status"]
          store_id: string
          time_end: string
          time_start: string
          title: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          category_slug: string
          center_lat: number
          center_lng: number
          conditions?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          original_price?: number
          promo_price?: number
          radius_meters?: number
          share_token?: string
          status?: Database["public"]["Enums"]["geo_offer_status"]
          store_id: string
          time_end?: string
          time_start?: string
          title: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          category_slug?: string
          center_lat?: number
          center_lng?: number
          conditions?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          original_price?: number
          promo_price?: number
          radius_meters?: number
          share_token?: string
          status?: Database["public"]["Enums"]["geo_offer_status"]
          store_id?: string
          time_end?: string
          time_start?: string
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geo_offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      group_offer_participants: {
        Row: {
          created_at: string
          group_offer_id: string
          id: string
          referrer_user_id: string | null
          user_id: string
          whatsapp_clicked_at: string | null
        }
        Insert: {
          created_at?: string
          group_offer_id: string
          id?: string
          referrer_user_id?: string | null
          user_id: string
          whatsapp_clicked_at?: string | null
        }
        Update: {
          created_at?: string
          group_offer_id?: string
          id?: string
          referrer_user_id?: string | null
          user_id?: string
          whatsapp_clicked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_offer_participants_group_offer_id_fkey"
            columns: ["group_offer_id"]
            isOneToOne: false
            referencedRelation: "group_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_offer_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_offer_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_offers: {
        Row: {
          category_slug: string
          conditions: string | null
          created_at: string
          description: string | null
          duration_hours: number
          ends_at: string | null
          id: string
          image_url: string | null
          original_price: number
          share_token: string
          starts_at: string | null
          status: Database["public"]["Enums"]["group_offer_status"]
          store_id: string
          tiers: Json
          title: string
          updated_at: string
        }
        Insert: {
          category_slug: string
          conditions?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          original_price?: number
          share_token?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["group_offer_status"]
          store_id: string
          tiers?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category_slug?: string
          conditions?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          original_price?: number
          share_token?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["group_offer_status"]
          store_id?: string
          tiers?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_badges: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      loyalty_checkin_tokens: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used_at: string | null
          used_by_store: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used_at?: string | null
          used_by_store?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          used_by_store?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_checkin_tokens_used_by_store_fkey"
            columns: ["used_by_store"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_ledger: {
        Row: {
          amount_cents: number
          created_at: string
          credit_cents: number
          expired_at: string | null
          expires_at: string | null
          id: string
          idempotency_key: string | null
          kind: Database["public"]["Enums"]["loyalty_ledger_kind"]
          membership_id: string | null
          points: number
          reason: string
          ref_id: string | null
          ref_type: string | null
          store_id: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          credit_cents?: number
          expired_at?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          kind?: Database["public"]["Enums"]["loyalty_ledger_kind"]
          membership_id?: string | null
          points?: number
          reason: string
          ref_id?: string | null
          ref_type?: string | null
          store_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          credit_cents?: number
          expired_at?: string | null
          expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          kind?: Database["public"]["Enums"]["loyalty_ledger_kind"]
          membership_id?: string | null
          points?: number
          reason?: string
          ref_id?: string | null
          ref_type?: string | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_ledger_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "loyalty_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_ledger_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_memberships: {
        Row: {
          credit_cents: number
          id: string
          joined_at: string
          last_visit_at: string | null
          points_balance: number
          points_lifetime: number
          store_id: string
          tier_id: string | null
          updated_at: string
          user_id: string
          visits_count: number
        }
        Insert: {
          credit_cents?: number
          id?: string
          joined_at?: string
          last_visit_at?: string | null
          points_balance?: number
          points_lifetime?: number
          store_id: string
          tier_id?: string | null
          updated_at?: string
          user_id: string
          visits_count?: number
        }
        Update: {
          credit_cents?: number
          id?: string
          joined_at?: string
          last_visit_at?: string | null
          points_balance?: number
          points_lifetime?: number
          store_id?: string
          tier_id?: string | null
          updated_at?: string
          user_id?: string
          visits_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_memberships_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_memberships_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_mission_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          period_start: string
          progress: number
          store_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          period_start?: string
          progress?: number
          store_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          period_start?: string
          progress?: number
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "loyalty_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_mission_progress_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_missions: {
        Row: {
          active: boolean
          badge_slug: string | null
          created_at: string
          description: string | null
          goal_count: number
          goal_type: string
          id: string
          period: string
          reward_points: number
          store_id: string | null
          title: string
        }
        Insert: {
          active?: boolean
          badge_slug?: string | null
          created_at?: string
          description?: string | null
          goal_count?: number
          goal_type: string
          id?: string
          period?: string
          reward_points?: number
          store_id?: string | null
          title: string
        }
        Update: {
          active?: boolean
          badge_slug?: string | null
          created_at?: string
          description?: string | null
          goal_count?: number
          goal_type?: string
          id?: string
          period?: string
          reward_points?: number
          store_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_missions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          active: boolean
          cashback_percent: number
          checkin_radius_meters: number
          created_at: string
          id: string
          points_expire_months: number
          rules: Json
          store_id: string
          terms: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cashback_percent?: number
          checkin_radius_meters?: number
          created_at?: string
          id?: string
          points_expire_months?: number
          rules?: Json
          store_id: string
          terms?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cashback_percent?: number
          checkin_radius_meters?: number
          created_at?: string
          id?: string
          points_expire_months?: number
          rules?: Json
          store_id?: string
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_redemptions: {
        Row: {
          code: string
          coupon_redemption_id: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          points_spent: number
          reward_id: string
          status: Database["public"]["Enums"]["loyalty_redemption_status"]
          store_id: string
          user_id: string
        }
        Insert: {
          code: string
          coupon_redemption_id?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          points_spent?: number
          reward_id: string
          status?: Database["public"]["Enums"]["loyalty_redemption_status"]
          store_id: string
          user_id: string
        }
        Update: {
          code?: string
          coupon_redemption_id?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          points_spent?: number
          reward_id?: string
          status?: Database["public"]["Enums"]["loyalty_redemption_status"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_coupon_redemption_id_fkey"
            columns: ["coupon_redemption_id"]
            isOneToOne: false
            referencedRelation: "coupon_redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_referrals: {
        Row: {
          created_at: string
          credited_at: string | null
          id: string
          invited_user_id: string
          referrer_user_id: string
          store_id: string
        }
        Insert: {
          created_at?: string
          credited_at?: string | null
          id?: string
          invited_user_id: string
          referrer_user_id: string
          store_id: string
        }
        Update: {
          created_at?: string
          credited_at?: string | null
          id?: string
          invited_user_id?: string
          referrer_user_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_referrals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          active: boolean
          coupon_id: string | null
          created_at: string
          credit_cents: number
          description: string | null
          id: string
          image_url: string | null
          kind: Database["public"]["Enums"]["loyalty_reward_kind"]
          min_tier_id: string | null
          points_cost: number
          stock: number | null
          store_id: string
          title: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          coupon_id?: string | null
          created_at?: string
          credit_cents?: number
          description?: string | null
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["loyalty_reward_kind"]
          min_tier_id?: string | null
          points_cost?: number
          stock?: number | null
          store_id: string
          title: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          coupon_id?: string | null
          created_at?: string
          credit_cents?: number
          description?: string | null
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["loyalty_reward_kind"]
          min_tier_id?: string | null
          points_cost?: number
          stock?: number | null
          store_id?: string
          title?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_min_tier_id_fkey"
            columns: ["min_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          created_at: string
          early_access: boolean
          extra_discount_percent: number
          id: string
          min_points: number
          multiplier: number
          name: string
          perks: Json
          sort_order: number
          store_id: string
        }
        Insert: {
          created_at?: string
          early_access?: boolean
          extra_discount_percent?: number
          id?: string
          min_points?: number
          multiplier?: number
          name: string
          perks?: Json
          sort_order?: number
          store_id: string
        }
        Update: {
          created_at?: string
          early_access?: boolean
          extra_discount_percent?: number
          id?: string
          min_points?: number
          multiplier?: number
          name?: string
          perks?: Json
          sort_order?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tiers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_user_badges: {
        Row: {
          badge_slug: string
          created_at: string
          id: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          badge_slug: string
          created_at?: string
          id?: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          badge_slug?: string
          created_at?: string
          id?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_user_badges_badge_slug_fkey"
            columns: ["badge_slug"]
            isOneToOne: false
            referencedRelation: "loyalty_badges"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "loyalty_user_badges_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          bytes: number | null
          created_at: string
          duration_seconds: number | null
          filename: string | null
          height: number | null
          id: string
          media_type: string
          poster_url: string | null
          storage_path: string | null
          store_id: string
          tags: string[]
          updated_at: string
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bytes?: number | null
          created_at?: string
          duration_seconds?: number | null
          filename?: string | null
          height?: number | null
          id?: string
          media_type?: string
          poster_url?: string | null
          storage_path?: string | null
          store_id: string
          tags?: string[]
          updated_at?: string
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bytes?: number | null
          created_at?: string
          duration_seconds?: number | null
          filename?: string | null
          height?: number | null
          id?: string
          media_type?: string
          poster_url?: string | null
          storage_path?: string | null
          store_id?: string
          tags?: string[]
          updated_at?: string
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          city_new_offers: boolean
          events: boolean
          expiring_favorites: boolean
          marketing: boolean
          new_offers_followed_stores: boolean
          proximity_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          city_new_offers?: boolean
          events?: boolean
          expiring_favorites?: boolean
          marketing?: boolean
          new_offers_followed_stores?: boolean
          proximity_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          city_new_offers?: boolean
          events?: boolean
          expiring_favorites?: boolean
          marketing?: boolean
          new_offers_followed_stores?: boolean
          proximity_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          audience: string
          body: string
          created_at: string
          id: string
          offer_id: string | null
          recipients_count: number
          sent_by: string | null
          store_id: string | null
          success_count: number
          title: string
          url: string | null
        }
        Insert: {
          audience: string
          body: string
          created_at?: string
          id?: string
          offer_id?: string | null
          recipients_count?: number
          sent_by?: string | null
          store_id?: string | null
          success_count?: number
          title: string
          url?: string | null
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          id?: string
          offer_id?: string | null
          recipients_count?: number
          sent_by?: string | null
          store_id?: string | null
          success_count?: number
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      offer_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          offer_id: string
          referrer: string | null
          session_id: string | null
          store_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          offer_id: string
          referrer?: string | null
          session_id?: string | null
          store_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          offer_id?: string
          referrer?: string | null
          session_id?: string | null
          store_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      offer_media: {
        Row: {
          created_at: string
          is_cover: boolean
          media_id: string
          offer_id: string
          position: number
        }
        Insert: {
          created_at?: string
          is_cover?: boolean
          media_id: string
          offer_id: string
          position?: number
        }
        Update: {
          created_at?: string
          is_cover?: boolean
          media_id?: string
          offer_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_media_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_review_photos: {
        Row: {
          created_at: string
          id: string
          image_url: string
          review_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          review_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          review_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "offer_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          offer_id: string
          rating: number
          rejection_reason: string | null
          status: Database["public"]["Enums"]["review_status"]
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          offer_id: string
          rating: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          offer_id?: string
          rating?: number
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          auto_renew: boolean
          auto_renew_count: number
          auto_renew_days: number
          category_slug: string
          conditions: string | null
          created_at: string
          description: string | null
          featured: boolean
          flash_duration_hours: number | null
          flash_ends_at: string | null
          flash_starts_at: string | null
          id: string
          image_url: string | null
          is_flash: boolean
          is_scheduled: boolean
          last_auto_renewed_at: string | null
          original_price: number
          popularity: number
          promo_price: number
          scheduled_end_at: string | null
          scheduled_published_at: string | null
          scheduled_start_at: string | null
          status: Database["public"]["Enums"]["offer_status"]
          store_id: string
          title: string
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          auto_renew?: boolean
          auto_renew_count?: number
          auto_renew_days?: number
          category_slug: string
          conditions?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          flash_duration_hours?: number | null
          flash_ends_at?: string | null
          flash_starts_at?: string | null
          id?: string
          image_url?: string | null
          is_flash?: boolean
          is_scheduled?: boolean
          last_auto_renewed_at?: string | null
          original_price?: number
          popularity?: number
          promo_price?: number
          scheduled_end_at?: string | null
          scheduled_published_at?: string | null
          scheduled_start_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          store_id: string
          title: string
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          auto_renew?: boolean
          auto_renew_count?: number
          auto_renew_days?: number
          category_slug?: string
          conditions?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          flash_duration_hours?: number | null
          flash_ends_at?: string | null
          flash_starts_at?: string | null
          id?: string
          image_url?: string | null
          is_flash?: boolean
          is_scheduled?: boolean
          last_auto_renewed_at?: string | null
          original_price?: number
          popularity?: number
          promo_price?: number
          scheduled_end_at?: string | null
          scheduled_published_at?: string | null
          scheduled_start_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          store_id?: string
          title?: string
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          featured_slots: number
          features: Json
          id: string
          max_offers: number
          name: string
          price_cents: number
          price_cents_yearly: number | null
          slug: string
          sort_order: number
          stripe_price_id: string | null
          stripe_price_id_yearly: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          featured_slots?: number
          features?: Json
          id?: string
          max_offers?: number
          name: string
          price_cents?: number
          price_cents_yearly?: number | null
          slug: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_price_id_yearly?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          featured_slots?: number
          features?: Json
          id?: string
          max_offers?: number
          name?: string
          price_cents?: number
          price_cents_yearly?: number | null
          slug?: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_price_id_yearly?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          loyalty_ranking_opt_in: boolean
          nickname: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          loyalty_ranking_opt_in?: boolean
          nickname?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          loyalty_ranking_opt_in?: boolean
          nickname?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      review_prompts: {
        Row: {
          created_at: string
          dismissed_at: string | null
          dismissed_permanently: boolean
          eligible_at: string
          id: string
          notified_at: string | null
          offer_id: string
          remind_after: string | null
          store_id: string
          triggered_event_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed_at?: string | null
          dismissed_permanently?: boolean
          eligible_at: string
          id?: string
          notified_at?: string | null
          offer_id: string
          remind_after?: string | null
          store_id: string
          triggered_event_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed_at?: string | null
          dismissed_permanently?: boolean
          eligible_at?: string
          id?: string
          notified_at?: string | null
          offer_id?: string
          remind_after?: string | null
          store_id?: string
          triggered_event_type?: string
          user_id?: string
        }
        Relationships: []
      }
      store_duty_schedules: {
        Row: {
          active: boolean
          category_slug: string
          city: string
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          state: string
          store_id: string
        }
        Insert: {
          active?: boolean
          category_slug: string
          city: string
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          state: string
          store_id: string
        }
        Update: {
          active?: boolean
          category_slug?: string
          city?: string
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          state?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_duty_schedules_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "store_duty_schedules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_favorites: {
        Row: {
          created_at: string
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_favorites_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_followers: {
        Row: {
          created_at: string
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          approved: boolean
          city: string
          cover_url: string | null
          created_at: string
          description: string | null
          featured_badge: boolean
          id: string
          instagram: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          slug: string
          state: string
          trial_days_override: number | null
          trial_granted_at: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          approved?: boolean
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured_badge?: boolean
          id?: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          slug: string
          state?: string
          trial_days_override?: number | null
          trial_granted_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          approved?: boolean
          city?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured_badge?: boolean
          id?: string
          instagram?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          slug?: string
          state?: string
          trial_days_override?: number | null
          trial_granted_at?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          store_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          store_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          store_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          category_slug: string
          created_at: string
          user_id: string
          weight: number
        }
        Insert: {
          category_slug: string
          created_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          category_slug?: string
          created_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_view_history: {
        Row: {
          city: string | null
          entity_id: string
          entity_type: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          city?: string | null
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          city?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      active_geo_offer_for_store: {
        Args: { p_store_id: string }
        Returns: {
          category_slug: string
          center_lat: number
          center_lng: number
          conditions: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          original_price: number
          promo_price: number
          radius_meters: number
          share_token: string
          status: Database["public"]["Enums"]["geo_offer_status"]
          store_id: string
          time_end: string
          time_start: string
          title: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "geo_offers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      approve_event: { Args: { p_id: string }; Returns: undefined }
      auction_current_price: {
        Args: { p_offer: Database["public"]["Tables"]["auction_offers"]["Row"] }
        Returns: number
      }
      auction_social_proof: { Args: { p_auction_id: string }; Returns: Json }
      auction_state: { Args: { p_token: string }; Returns: Json }
      calc_flyscore_pilares: { Args: { _store_id: string }; Returns: Json }
      category_benchmark: {
        Args: { p_days?: number; p_store_id: string }
        Returns: Json
      }
      claim_unique_coupon: { Args: { p_coupon_id: string }; Returns: Json }
      duplicate_offer: { Args: { p_offer_id: string }; Returns: string }
      duty_limit_for: { Args: { p_category: string }; Returns: number }
      duty_schedule_create: {
        Args: {
          p_category: string
          p_ends: string
          p_starts: string
          p_store_id: string
        }
        Returns: Json
      }
      event_by_slug: { Args: { p_slug: string }; Returns: Json }
      event_track_view: { Args: { p_id: string }; Returns: undefined }
      geo_offer_register_visit: {
        Args: {
          p_lat: number
          p_lng: number
          p_session_id?: string
          p_token: string
        }
        Returns: Json
      }
      geo_offer_state: {
        Args: { p_lat?: number; p_lng?: number; p_token: string }
        Returns: Json
      }
      grant_store_trial: {
        Args: { p_days: number; p_plan_slug: string; p_store_id: string }
        Returns: Json
      }
      group_offer_state: { Args: { p_token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      haversine_meters: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      loyalty_award: {
        Args: {
          _amount_cents?: number
          _apply_multiplier?: boolean
          _credit_cents?: number
          _daily_cap?: number
          _idem?: string
          _points: number
          _reason: string
          _ref_id?: string
          _ref_type?: string
          _store_id: string
          _user_id: string
        }
        Returns: string
      }
      loyalty_checkin: {
        Args: { p_lat: number; p_lng: number; p_store_id: string }
        Returns: Json
      }
      loyalty_city_ranking: {
        Args: { p_city: string; p_limit?: number }
        Returns: Json
      }
      loyalty_expire_points: { Args: never; Returns: Json }
      loyalty_expiring_soon: {
        Args: { p_days?: number }
        Returns: {
          expires_at: string
          points: number
          store_id: string
          store_name: string
          user_id: string
        }[]
      }
      loyalty_fulfill_redemption: { Args: { p_code: string }; Returns: Json }
      loyalty_issue_qr: { Args: never; Returns: Json }
      loyalty_join: { Args: { p_store_id: string }; Returns: Json }
      loyalty_progress_missions: {
        Args: { _reason: string; _store_id: string; _user_id: string }
        Returns: undefined
      }
      loyalty_reason_points: {
        Args: { _reason: string; _store_id: string }
        Returns: number
      }
      loyalty_recalc_tier: {
        Args: { _membership_id: string }
        Returns: undefined
      }
      loyalty_redeem_reward: { Args: { p_reward_id: string }; Returns: Json }
      loyalty_register_referral: {
        Args: { p_referrer_id: string; p_store_id: string }
        Returns: Json
      }
      loyalty_rules: { Args: { _store_id: string }; Returns: Json }
      loyalty_state: { Args: { p_store_id: string }; Returns: Json }
      loyalty_store_report: {
        Args: { p_days?: number; p_store_id: string }
        Returns: Json
      }
      loyalty_track_action: {
        Args: { p_reason: string; p_ref_id?: string; p_store_id: string }
        Returns: Json
      }
      loyalty_validate_purchase: {
        Args: {
          p_amount_cents: number
          p_code: string
          p_use_credit_cents?: number
        }
        Returns: Json
      }
      loyalty_wallet: { Args: never; Returns: Json }
      offer_rating_summary: { Args: { p_offer_id: string }; Returns: Json }
      offer_social_proof: { Args: { p_offer_ids: string[] }; Returns: Json }
      pending_reviews_for_user: {
        Args: never
        Returns: {
          eligible_at: string
          offer_id: string
          offer_image: string
          offer_title: string
          prompt_id: string
          store_id: string
          store_logo: string
          store_name: string
        }[]
      }
      recompute_all_flyscores: { Args: never; Returns: number }
      recompute_flyscore: { Args: { _store_id: string }; Returns: undefined }
      redeem_coupon: { Args: { p_coupon_id: string }; Returns: Json }
      reject_event: {
        Args: { p_id: string; p_reason: string }
        Returns: undefined
      }
      reserve_auction: { Args: { p_token: string }; Returns: Json }
      set_store_trial_override: {
        Args: { p_days: number; p_store_id: string }
        Returns: undefined
      }
      store_intelligence: {
        Args: { p_days?: number; p_store_id: string }
        Returns: Json
      }
      store_rating_summary: { Args: { p_store_id: string }; Returns: Json }
      track_auction_event: {
        Args: {
          p_auction_id: string
          p_event_type: string
          p_referrer?: string
          p_session_id?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      track_offer_event: {
        Args: {
          p_event_type: string
          p_offer_id: string
          p_referrer?: string
          p_session_id?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      trial_default_days: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "lojista" | "consumer"
      auction_status:
        | "pending"
        | "approved"
        | "sold_out"
        | "expired"
        | "rejected"
      coupon_kind: "fixed" | "unique"
      discount_type: "percent" | "amount"
      event_kind: "happy_hour" | "show" | "feira" | "evento" | "promocao"
      event_status: "pending" | "approved" | "rejected" | "expired"
      geo_offer_status: "pending" | "approved" | "expired" | "rejected"
      group_offer_status: "pending" | "approved" | "rejected" | "expired"
      loyalty_ledger_kind: "credit" | "debit" | "expire"
      loyalty_redemption_status: "pending" | "fulfilled" | "canceled"
      loyalty_reward_kind: "coupon" | "credit" | "gift" | "tier_benefit"
      offer_status: "pending" | "approved" | "rejected" | "paused"
      offer_type: "desconto" | "cupom" | "brinde"
      review_status: "pending" | "approved" | "rejected"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "unpaid"
        | "incomplete_expired"
        | "paused"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "lojista", "consumer"],
      auction_status: [
        "pending",
        "approved",
        "sold_out",
        "expired",
        "rejected",
      ],
      coupon_kind: ["fixed", "unique"],
      discount_type: ["percent", "amount"],
      event_kind: ["happy_hour", "show", "feira", "evento", "promocao"],
      event_status: ["pending", "approved", "rejected", "expired"],
      geo_offer_status: ["pending", "approved", "expired", "rejected"],
      group_offer_status: ["pending", "approved", "rejected", "expired"],
      loyalty_ledger_kind: ["credit", "debit", "expire"],
      loyalty_redemption_status: ["pending", "fulfilled", "canceled"],
      loyalty_reward_kind: ["coupon", "credit", "gift", "tier_benefit"],
      offer_status: ["pending", "approved", "rejected", "paused"],
      offer_type: ["desconto", "cupom", "brinde"],
      review_status: ["pending", "approved", "rejected"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "unpaid",
        "incomplete_expired",
        "paused",
      ],
    },
  },
} as const
