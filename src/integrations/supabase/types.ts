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
          flash_default_hours: number
          group_offer_max_active_per_store: number
          id: boolean
          review_prompt_hours: number
          social_proof_min_viewers_now: number
          social_proof_min_views_today: number
          social_proof_now_window_minutes: number
          updated_at: string
        }
        Insert: {
          auction_max_active_per_store?: number
          flash_default_hours?: number
          group_offer_max_active_per_store?: number
          id?: boolean
          review_prompt_hours?: number
          social_proof_min_viewers_now?: number
          social_proof_min_views_today?: number
          social_proof_now_window_minutes?: number
          updated_at?: string
        }
        Update: {
          auction_max_active_per_store?: number
          flash_default_hours?: number
          group_offer_max_active_per_store?: number
          id?: boolean
          review_prompt_hours?: number
          social_proof_min_viewers_now?: number
          social_proof_min_views_today?: number
          social_proof_now_window_minutes?: number
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
      notification_preferences: {
        Row: {
          city_new_offers: boolean
          expiring_favorites: boolean
          marketing: boolean
          new_offers_followed_stores: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          city_new_offers?: boolean
          expiring_favorites?: boolean
          marketing?: boolean
          new_offers_followed_stores?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          city_new_offers?: boolean
          expiring_favorites?: boolean
          marketing?: boolean
          new_offers_followed_stores?: boolean
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
          last_auto_renewed_at: string | null
          original_price: number
          popularity: number
          promo_price: number
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
          last_auto_renewed_at?: string | null
          original_price?: number
          popularity?: number
          promo_price?: number
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
          last_auto_renewed_at?: string | null
          original_price?: number
          popularity?: number
          promo_price?: number
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
          slug: string
          sort_order: number
          stripe_price_id: string | null
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
          slug: string
          sort_order?: number
          stripe_price_id?: string | null
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
          slug?: string
          sort_order?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
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
          owner_id: string
          phone: string | null
          slug: string
          state: string
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
          owner_id: string
          phone?: string | null
          slug: string
          state?: string
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
          owner_id?: string
          phone?: string | null
          slug?: string
          state?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auction_current_price: {
        Args: { p_offer: Database["public"]["Tables"]["auction_offers"]["Row"] }
        Returns: number
      }
      auction_state: { Args: { p_token: string }; Returns: Json }
      category_benchmark: {
        Args: { p_days?: number; p_store_id: string }
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
      reserve_auction: { Args: { p_token: string }; Returns: Json }
      store_intelligence: {
        Args: { p_days?: number; p_store_id: string }
        Returns: Json
      }
      store_rating_summary: { Args: { p_store_id: string }; Returns: Json }
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
    }
    Enums: {
      app_role: "admin" | "lojista" | "consumer"
      auction_status:
        | "pending"
        | "approved"
        | "sold_out"
        | "expired"
        | "rejected"
      group_offer_status: "pending" | "approved" | "rejected" | "expired"
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
    Enums: {
      app_role: ["admin", "lojista", "consumer"],
      auction_status: [
        "pending",
        "approved",
        "sold_out",
        "expired",
        "rejected",
      ],
      group_offer_status: ["pending", "approved", "rejected", "expired"],
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
      ],
    },
  },
} as const
