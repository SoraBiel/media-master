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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_media: {
        Row: {
          created_at: string
          description: string | null
          file_count: number | null
          id: string
          image_url: string | null
          media_files: Json | null
          min_plan: string
          name: string
          pack_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_count?: number | null
          id?: string
          image_url?: string | null
          media_files?: Json | null
          min_plan?: string
          name: string
          pack_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_count?: number | null
          id?: string
          image_url?: string | null
          media_files?: Json | null
          min_plan?: string
          name?: string
          pack_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          caption: string | null
          completed_at: string | null
          created_at: string
          delay_seconds: number | null
          destination_id: string | null
          error_message: string | null
          id: string
          media_pack_id: string | null
          name: string
          progress: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          send_mode: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          total_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          completed_at?: string | null
          created_at?: string
          delay_seconds?: number | null
          destination_id?: string | null
          error_message?: string | null
          id?: string
          media_pack_id?: string | null
          name: string
          progress?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          send_mode?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          total_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          completed_at?: string | null
          created_at?: string
          delay_seconds?: number | null
          destination_id?: string | null
          error_message?: string | null
          id?: string
          media_pack_id?: string | null
          name?: string
          progress?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          send_mode?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          total_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_media_pack_id_fkey"
            columns: ["media_pack_id"]
            isOneToOne: false
            referencedRelation: "admin_media"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          item_id: string
          item_type: string
          payment_id: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          payment_id?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          payment_id?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          amount_cents: number
          created_at: string | null
          expires_at: string | null
          id: string
          product_id: string | null
          product_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          product_id?: string | null
          product_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          product_id?: string | null
          product_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_data: Json | null
          id: string
          product_id: string
          product_type: string
          transaction_id: string | null
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_data?: Json | null
          id?: string
          product_id: string
          product_type: string
          transaction_id?: string | null
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_data?: Json | null
          id?: string
          product_id?: string
          product_type?: string
          transaction_id?: string | null
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          chat_id: string
          chat_title: string | null
          chat_type: string | null
          created_at: string
          id: string
          last_sent_at: string | null
          members_count: number | null
          name: string
          status: string | null
          telegram_integration_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          chat_title?: string | null
          chat_type?: string | null
          created_at?: string
          id?: string
          last_sent_at?: string | null
          members_count?: number | null
          name: string
          status?: string | null
          telegram_integration_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          chat_title?: string | null
          chat_type?: string | null
          created_at?: string
          id?: string
          last_sent_at?: string | null
          members_count?: number | null
          name?: string
          status?: string | null
          telegram_integration_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "destinations_telegram_integration_id_fkey"
            columns: ["telegram_integration_id"]
            isOneToOne: false
            referencedRelation: "telegram_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      models_for_sale: {
        Row: {
          assets: Json | null
          bio: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          deliverable_info: string | null
          deliverable_link: string | null
          deliverable_notes: string | null
          id: string
          image_url: string | null
          is_sold: boolean | null
          name: string
          niche: string | null
          price_cents: number
          scripts: Json | null
          sold_at: string | null
          sold_to_user_id: string | null
        }
        Insert: {
          assets?: Json | null
          bio?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_info?: string | null
          deliverable_link?: string | null
          deliverable_notes?: string | null
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          name: string
          niche?: string | null
          price_cents: number
          scripts?: Json | null
          sold_at?: string | null
          sold_to_user_id?: string | null
        }
        Update: {
          assets?: Json | null
          bio?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_info?: string | null
          deliverable_link?: string | null
          deliverable_notes?: string | null
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          name?: string
          niche?: string | null
          price_cents?: number
          scripts?: Json | null
          sold_at?: string | null
          sold_to_user_id?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          has_ai_models: boolean | null
          has_scheduling: boolean | null
          id: string
          is_active: boolean | null
          max_destinations: number | null
          max_media_per_month: number | null
          name: string
          price_cents: number
          slug: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          has_ai_models?: boolean | null
          has_scheduling?: boolean | null
          id?: string
          is_active?: boolean | null
          max_destinations?: number | null
          max_media_per_month?: number | null
          name: string
          price_cents?: number
          slug: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          has_ai_models?: boolean | null
          has_scheduling?: boolean | null
          id?: string
          is_active?: boolean | null
          max_destinations?: number | null
          max_media_per_month?: number | null
          name?: string
          price_cents?: number
          slug?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_plan: Database["public"]["Enums"]["plan_type"] | null
          email: string
          full_name: string | null
          id: string
          is_online: boolean | null
          is_suspended: boolean | null
          last_seen_at: string | null
          onboarding_completed: boolean | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_plan?: Database["public"]["Enums"]["plan_type"] | null
          email: string
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          is_suspended?: boolean | null
          last_seen_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_plan?: Database["public"]["Enums"]["plan_type"] | null
          email?: string
          full_name?: string | null
          id?: string
          is_online?: boolean | null
          is_suspended?: boolean | null
          last_seen_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_integrations: {
        Row: {
          bot_name: string | null
          bot_token: string
          bot_username: string | null
          chat_id: string | null
          chat_title: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          is_validated: boolean | null
          last_validated_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_name?: string | null
          bot_token: string
          bot_username?: string | null
          chat_id?: string | null
          chat_title?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          is_validated?: boolean | null
          last_validated_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_name?: string | null
          bot_token?: string
          bot_username?: string | null
          chat_id?: string | null
          chat_title?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          is_validated?: boolean | null
          last_validated_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tiktok_accounts: {
        Row: {
          created_at: string | null
          created_by: string | null
          deliverable_email: string | null
          deliverable_info: string | null
          deliverable_login: string | null
          deliverable_notes: string | null
          deliverable_password: string | null
          description: string | null
          followers: number | null
          id: string
          image_url: string | null
          is_sold: boolean | null
          is_verified: boolean | null
          likes: number | null
          niche: string | null
          price_cents: number
          sold_at: string | null
          sold_to_user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deliverable_email?: string | null
          deliverable_info?: string | null
          deliverable_login?: string | null
          deliverable_notes?: string | null
          deliverable_password?: string | null
          description?: string | null
          followers?: number | null
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          is_verified?: boolean | null
          likes?: number | null
          niche?: string | null
          price_cents: number
          sold_at?: string | null
          sold_to_user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deliverable_email?: string | null
          deliverable_info?: string | null
          deliverable_login?: string | null
          deliverable_notes?: string | null
          deliverable_password?: string | null
          description?: string | null
          followers?: number | null
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          is_verified?: boolean | null
          likes?: number | null
          niche?: string | null
          price_cents?: number
          sold_at?: string | null
          sold_to_user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_cents: number
          buckpay_id: string | null
          buyer_document: string | null
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string | null
          external_id: string
          id: string
          net_amount_cents: number | null
          payment_method: string | null
          pix_code: string | null
          pix_qrcode_base64: string | null
          product_id: string | null
          product_type: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          buckpay_id?: string | null
          buyer_document?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string | null
          external_id: string
          id?: string
          net_amount_cents?: number | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qrcode_base64?: string | null
          product_id?: string | null
          product_type?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          buckpay_id?: string | null
          buyer_document?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string | null
          external_id?: string
          id?: string
          net_amount_cents?: number | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qrcode_base64?: string | null
          product_id?: string | null
          product_type?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_metrics: {
        Row: {
          created_at: string
          id: string
          last_activity_at: string | null
          media_sent: number | null
          telegram_integrations_active: number | null
          total_actions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_at?: string | null
          media_sent?: number | null
          telegram_integrations_active?: number | null
          total_actions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_at?: string | null
          media_sent?: number | null
          telegram_integrations_active?: number | null
          total_actions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "vendor"
      plan_type: "free" | "basic" | "pro" | "agency"
      subscription_status: "active" | "pending" | "cancelled" | "expired"
      transaction_status: "pending" | "paid" | "failed" | "refunded"
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
      app_role: ["admin", "user", "vendor"],
      plan_type: ["free", "basic", "pro", "agency"],
      subscription_status: ["active", "pending", "cancelled", "expired"],
      transaction_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
