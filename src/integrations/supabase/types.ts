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
      admin_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: boolean
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_settings_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_value: boolean
          old_value: boolean | null
          setting_key: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_value: boolean
          old_value?: boolean | null
          setting_key: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_value?: boolean
          old_value?: boolean | null
          setting_key?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          avg_send_time_ms: number | null
          caption: string | null
          completed_at: string | null
          created_at: string
          delay_seconds: number | null
          destination_id: string | null
          error_count: number | null
          error_message: string | null
          errors_log: Json | null
          id: string
          media_pack_id: string | null
          name: string
          pack_size: number | null
          progress: number | null
          runner_lock_expires_at: string | null
          runner_lock_token: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          send_mode: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          success_count: number | null
          total_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_send_time_ms?: number | null
          caption?: string | null
          completed_at?: string | null
          created_at?: string
          delay_seconds?: number | null
          destination_id?: string | null
          error_count?: number | null
          error_message?: string | null
          errors_log?: Json | null
          id?: string
          media_pack_id?: string | null
          name: string
          pack_size?: number | null
          progress?: number | null
          runner_lock_expires_at?: string | null
          runner_lock_token?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          send_mode?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          success_count?: number | null
          total_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_send_time_ms?: number | null
          caption?: string | null
          completed_at?: string | null
          created_at?: string
          delay_seconds?: number | null
          destination_id?: string | null
          error_count?: number | null
          error_message?: string | null
          errors_log?: Json | null
          id?: string
          media_pack_id?: string | null
          name?: string
          pack_size?: number | null
          progress?: number | null
          runner_lock_expires_at?: string | null
          runner_lock_token?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          send_mode?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          success_count?: number | null
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
      commissions: {
        Row: {
          amount_cents: number
          commission_cents: number
          commission_percent: number
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          referral_id: string
          referred_id: string
          referrer_id: string
          status: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          commission_cents: number
          commission_percent: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          referral_id: string
          referred_id: string
          referrer_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          commission_cents?: number
          commission_percent?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          referral_id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_banners: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_text: string | null
          link_url: string | null
          priority: number
          starts_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          priority?: number
          starts_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          priority?: number
          starts_at?: string | null
          title?: string | null
          updated_at?: string
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
      funnel_edges: {
        Row: {
          created_at: string
          funnel_id: string
          id: string
          source_handle: string | null
          source_node_id: string
          target_node_id: string
        }
        Insert: {
          created_at?: string
          funnel_id: string
          id?: string
          source_handle?: string | null
          source_node_id: string
          target_node_id: string
        }
        Update: {
          created_at?: string
          funnel_id?: string
          id?: string
          source_handle?: string | null
          source_node_id?: string
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_edges_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "funnel_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "funnel_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_nodes: {
        Row: {
          content: Json | null
          created_at: string
          funnel_id: string
          id: string
          node_type: string
          position_x: number
          position_y: number
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          funnel_id: string
          id?: string
          node_type?: string
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          funnel_id?: string
          id?: string
          node_type?: string
          position_x?: number
          position_y?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_nodes_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          delivered_at: string | null
          delivery_status: string | null
          fbclid: string | null
          funnel_id: string
          gclid: string | null
          id: string
          lead_chat_id: string | null
          lead_name: string | null
          paid_at: string | null
          pix_code: string | null
          pix_expiration: string | null
          pix_qrcode: string | null
          product_id: string | null
          provider: string
          provider_payment_id: string | null
          reminded_at: string | null
          status: string
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivery_status?: string | null
          fbclid?: string | null
          funnel_id: string
          gclid?: string | null
          id?: string
          lead_chat_id?: string | null
          lead_name?: string | null
          paid_at?: string | null
          pix_code?: string | null
          pix_expiration?: string | null
          pix_qrcode?: string | null
          product_id?: string | null
          provider?: string
          provider_payment_id?: string | null
          reminded_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivery_status?: string | null
          fbclid?: string | null
          funnel_id?: string
          gclid?: string | null
          id?: string
          lead_chat_id?: string | null
          lead_name?: string | null
          paid_at?: string | null
          pix_code?: string | null
          pix_expiration?: string | null
          pix_qrcode?: string | null
          product_id?: string | null
          provider?: string
          provider_payment_id?: string | null
          reminded_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_payments_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_payments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "funnel_products"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_products: {
        Row: {
          created_at: string
          currency: string
          delivery_content: string | null
          delivery_message: string | null
          delivery_type: string
          description: string | null
          funnel_id: string
          group_chat_id: string | null
          group_invite_link: string | null
          id: string
          is_active: boolean | null
          name: string
          payment_method: string
          price_cents: number
          product_type: string
          provider: string
          provider_product_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          delivery_content?: string | null
          delivery_message?: string | null
          delivery_type?: string
          description?: string | null
          funnel_id: string
          group_chat_id?: string | null
          group_invite_link?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          payment_method?: string
          price_cents: number
          product_type?: string
          provider?: string
          provider_product_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          delivery_content?: string | null
          delivery_message?: string | null
          delivery_type?: string
          description?: string | null
          funnel_id?: string
          group_chat_id?: string | null
          group_invite_link?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          payment_method?: string
          price_cents?: number
          product_type?: string
          provider?: string
          provider_product_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_products_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          edges: Json
          id: string
          is_active: boolean | null
          is_free: boolean | null
          name: string
          nodes: Json
          schema_version: number
          template_version: number
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          edges?: Json
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          name: string
          nodes?: Json
          schema_version?: number
          template_version?: number
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          edges?: Json
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          name?: string
          nodes?: Json
          schema_version?: number
          template_version?: number
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      funnels: {
        Row: {
          auto_remarketing_enabled: boolean | null
          auto_remarketing_message: string | null
          channel: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          payment_reminder_minutes: number | null
          schema_version: number | null
          telegram_integration_id: string | null
          trigger_keywords: string[] | null
          updated_at: string
          user_id: string
          webhook_registered: boolean | null
          webhook_url: string | null
        }
        Insert: {
          auto_remarketing_enabled?: boolean | null
          auto_remarketing_message?: string | null
          channel?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          payment_reminder_minutes?: number | null
          schema_version?: number | null
          telegram_integration_id?: string | null
          trigger_keywords?: string[] | null
          updated_at?: string
          user_id: string
          webhook_registered?: boolean | null
          webhook_url?: string | null
        }
        Update: {
          auto_remarketing_enabled?: boolean | null
          auto_remarketing_message?: string | null
          channel?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          payment_reminder_minutes?: number | null
          schema_version?: number | null
          telegram_integration_id?: string | null
          trigger_keywords?: string[] | null
          updated_at?: string
          user_id?: string
          webhook_registered?: boolean | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnels_telegram_integration_id_fkey"
            columns: ["telegram_integration_id"]
            isOneToOne: false
            referencedRelation: "telegram_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_accounts: {
        Row: {
          created_at: string | null
          created_by: string | null
          deliverable_email: string | null
          deliverable_info: string | null
          deliverable_login: string | null
          deliverable_notes: string | null
          deliverable_password: string | null
          description: string | null
          engagement_rate: number | null
          followers: number | null
          following: number | null
          id: string
          image_url: string | null
          is_sold: boolean | null
          is_verified: boolean | null
          niche: string | null
          posts_count: number | null
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
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          is_verified?: boolean | null
          niche?: string | null
          posts_count?: number | null
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
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          is_verified?: boolean | null
          niche?: string | null
          posts_count?: number | null
          price_cents?: number
          sold_at?: string | null
          sold_to_user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token: string
          api_token: string | null
          created_at: string
          environment: string
          id: string
          last_sync_at: string | null
          provider: string
          provider_email: string | null
          provider_name: string | null
          provider_user_id: string | null
          refresh_token: string | null
          status: string
          token_expires_at: string | null
          tracking_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          api_token?: string | null
          created_at?: string
          environment?: string
          id?: string
          last_sync_at?: string | null
          provider?: string
          provider_email?: string | null
          provider_name?: string | null
          provider_user_id?: string | null
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
          tracking_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          api_token?: string | null
          created_at?: string
          environment?: string
          id?: string
          last_sync_at?: string | null
          provider?: string
          provider_email?: string | null
          provider_name?: string | null
          provider_user_id?: string | null
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
          tracking_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          funnel_json: Json | null
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
          funnel_json?: Json | null
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
          funnel_json?: Json | null
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
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_text: string | null
          link_url: string | null
          message: string
          priority: number
          starts_at: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message: string
          priority?: number
          starts_at?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message?: string
          priority?: number
          starts_at?: string | null
          title?: string
          type?: string
          updated_at?: string
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
          max_funnels: number | null
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
          max_funnels?: number | null
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
          max_funnels?: number | null
          max_media_per_month?: number | null
          name?: string
          price_cents?: number
          slug?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      post_platform_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          platform: string
          platform_post_id: string | null
          post_id: string
          posted_at: string | null
          retry_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          platform_post_id?: string | null
          post_id: string
          posted_at?: string | null
          retry_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          platform_post_id?: string | null
          post_id?: string
          posted_at?: string | null
          retry_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_platform_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
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
      referral_allowed_roles: {
        Row: {
          created_at: string | null
          id: string
          role_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_name?: string
        }
        Relationships: []
      }
      referral_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      referral_role_commissions: {
        Row: {
          commission_percent: number
          created_at: string | null
          id: string
          role_name: string
          updated_at: string | null
        }
        Insert: {
          commission_percent: number
          created_at?: string | null
          id?: string
          role_name: string
          updated_at?: string | null
        }
        Update: {
          commission_percent?: number
          created_at?: string | null
          id?: string
          role_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          commission_type: string
          cookie_duration_days: number
          created_at: string | null
          default_commission_percent: number
          id: string
          is_enabled: boolean
          min_payout_cents: number
          updated_at: string | null
        }
        Insert: {
          commission_type?: string
          cookie_duration_days?: number
          created_at?: string | null
          default_commission_percent?: number
          id?: string
          is_enabled?: boolean
          min_payout_cents?: number
          updated_at?: string | null
        }
        Update: {
          commission_type?: string
          cookie_duration_days?: number
          created_at?: string | null
          default_commission_percent?: number
          id?: string
          is_enabled?: boolean
          min_payout_cents?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_urls: Json | null
          platforms: string[]
          scheduled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_urls?: Json | null
          platforms: string[]
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_urls?: Json | null
          platforms?: string[]
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smart_link_buttons: {
        Row: {
          click_count: number | null
          created_at: string
          event_name: string | null
          funnel_id: string | null
          funnel_tag: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          page_id: string
          position: number
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          event_name?: string | null
          funnel_id?: string | null
          funnel_tag?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          page_id: string
          position?: number
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          click_count?: number | null
          created_at?: string
          event_name?: string | null
          funnel_id?: string | null
          funnel_tag?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          page_id?: string
          position?: number
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_buttons_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_buttons_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "smart_link_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_link_clicks: {
        Row: {
          button_id: string
          clicked_at: string
          country: string | null
          id: string
          ip_address: string | null
          page_id: string
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          button_id: string
          clicked_at?: string
          country?: string | null
          id?: string
          ip_address?: string | null
          page_id: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          button_id?: string
          clicked_at?: string
          country?: string | null
          id?: string
          ip_address?: string | null
          page_id?: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_clicks_button_id_fkey"
            columns: ["button_id"]
            isOneToOne: false
            referencedRelation: "smart_link_buttons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_link_clicks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "smart_link_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_link_pages: {
        Row: {
          avatar_url: string | null
          background_color: string | null
          button_style: string | null
          created_at: string
          description: string | null
          google_analytics_id: string | null
          id: string
          is_active: boolean | null
          meta_pixel_id: string | null
          slug: string
          text_color: string | null
          tiktok_pixel_id: string | null
          title: string
          total_views: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          background_color?: string | null
          button_style?: string | null
          created_at?: string
          description?: string | null
          google_analytics_id?: string | null
          id?: string
          is_active?: boolean | null
          meta_pixel_id?: string | null
          slug: string
          text_color?: string | null
          tiktok_pixel_id?: string | null
          title: string
          total_views?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          background_color?: string | null
          button_style?: string | null
          created_at?: string
          description?: string | null
          google_analytics_id?: string | null
          id?: string
          is_active?: boolean | null
          meta_pixel_id?: string | null
          slug?: string
          text_color?: string | null
          tiktok_pixel_id?: string | null
          title?: string
          total_views?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smart_link_views: {
        Row: {
          id: string
          page_id: string
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          page_id: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_views_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "smart_link_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_avatar_url: string | null
          account_name: string | null
          account_username: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          last_used_at: string | null
          platform: string
          platform_user_id: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_avatar_url?: string | null
          account_name?: string | null
          account_username?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_used_at?: string | null
          platform: string
          platform_user_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_avatar_url?: string | null
          account_name?: string | null
          account_username?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_used_at?: string | null
          platform?: string
          platform_user_id?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
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
      telegram_groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          deliverable_info: string | null
          deliverable_invite_link: string | null
          deliverable_notes: string | null
          description: string | null
          group_name: string
          group_type: string | null
          group_username: string | null
          id: string
          image_url: string | null
          is_sold: boolean | null
          is_verified: boolean | null
          members_count: number | null
          niche: string | null
          price_cents: number
          sold_at: string | null
          sold_to_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deliverable_info?: string | null
          deliverable_invite_link?: string | null
          deliverable_notes?: string | null
          description?: string | null
          group_name: string
          group_type?: string | null
          group_username?: string | null
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          is_verified?: boolean | null
          members_count?: number | null
          niche?: string | null
          price_cents: number
          sold_at?: string | null
          sold_to_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deliverable_info?: string | null
          deliverable_invite_link?: string | null
          deliverable_notes?: string | null
          description?: string | null
          group_name?: string
          group_type?: string | null
          group_username?: string | null
          id?: string
          image_url?: string | null
          is_sold?: boolean | null
          is_verified?: boolean | null
          members_count?: number | null
          niche?: string | null
          price_cents?: number
          sold_at?: string | null
          sold_to_user_id?: string | null
        }
        Relationships: []
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
      telegram_logs: {
        Row: {
          created_at: string | null
          event_type: string
          funnel_id: string | null
          id: string
          node_id: string | null
          payload: Json | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          funnel_id?: string | null
          id?: string
          node_id?: string | null
          payload?: Json | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          funnel_id?: string | null
          id?: string
          node_id?: string | null
          payload?: Json | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_logs_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "telegram_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_sessions: {
        Row: {
          chat_id: string
          created_at: string | null
          current_node_id: string | null
          fbclid: string | null
          funnel_id: string
          gclid: string | null
          history: Json | null
          id: string
          is_finished: boolean | null
          last_message_at: string | null
          telegram_user_id: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variables: Json | null
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          current_node_id?: string | null
          fbclid?: string | null
          funnel_id: string
          gclid?: string | null
          history?: Json | null
          id?: string
          is_finished?: boolean | null
          last_message_at?: string | null
          telegram_user_id?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variables?: Json | null
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          current_node_id?: string | null
          fbclid?: string | null
          funnel_id?: string
          gclid?: string | null
          history?: Json | null
          id?: string
          is_finished?: boolean | null
          last_message_at?: string | null
          telegram_user_id?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_sessions_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
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
          is_admin_granted: boolean | null
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
          is_admin_granted?: boolean | null
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
          is_admin_granted?: boolean | null
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
      user_notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referral_commissions: {
        Row: {
          commission_percent: number
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commission_percent?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commission_percent?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
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
      vendor_sales: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          paid_at: string | null
          platform_fee_cents: number
          sale_amount_cents: number
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          vendor_commission_cents: number
          vendor_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          paid_at?: string | null
          platform_fee_cents: number
          sale_amount_cents: number
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          vendor_commission_cents: number
          vendor_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          paid_at?: string | null
          platform_fee_cents?: number
          sale_amount_cents?: number
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          vendor_commission_cents?: number
          vendor_id?: string
        }
        Relationships: []
      }
      wpp_accounts: {
        Row: {
          access_token: string
          business_name: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          last_validated_at: string | null
          phone_display: string | null
          phone_number_id: string
          status: string | null
          updated_at: string
          user_id: string
          waba_id: string
          webhook_verify_token: string
        }
        Insert: {
          access_token: string
          business_name?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_validated_at?: string | null
          phone_display?: string | null
          phone_number_id: string
          status?: string | null
          updated_at?: string
          user_id: string
          waba_id: string
          webhook_verify_token?: string
        }
        Update: {
          access_token?: string
          business_name?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_validated_at?: string | null
          phone_display?: string | null
          phone_number_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          waba_id?: string
          webhook_verify_token?: string
        }
        Relationships: []
      }
      wpp_contacts: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string | null
          name: string | null
          opt_in_status: string | null
          phone: string
          profile_name: string | null
          updated_at: string
          user_id: string
          wa_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          name?: string | null
          opt_in_status?: string | null
          phone: string
          profile_name?: string | null
          updated_at?: string
          user_id: string
          wa_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          name?: string | null
          opt_in_status?: string | null
          phone?: string
          profile_name?: string | null
          updated_at?: string
          user_id?: string
          wa_id?: string
        }
        Relationships: []
      }
      wpp_conversations: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          pricing_category: string | null
          updated_at: string
          user_id: string
          wa_id: string
          window_open_until: string | null
          wpp_account_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          pricing_category?: string | null
          updated_at?: string
          user_id: string
          wa_id: string
          window_open_until?: string | null
          wpp_account_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          pricing_category?: string | null
          updated_at?: string
          user_id?: string
          wa_id?: string
          window_open_until?: string | null
          wpp_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wpp_conversations_wpp_account_id_fkey"
            columns: ["wpp_account_id"]
            isOneToOne: false
            referencedRelation: "wpp_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      wpp_logs: {
        Row: {
          created_at: string | null
          event_type: string
          funnel_id: string | null
          id: string
          node_id: string | null
          payload: Json | null
          session_id: string | null
          user_id: string
          wpp_account_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          funnel_id?: string | null
          id?: string
          node_id?: string | null
          payload?: Json | null
          session_id?: string | null
          user_id: string
          wpp_account_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          funnel_id?: string | null
          id?: string
          node_id?: string | null
          payload?: Json | null
          session_id?: string | null
          user_id?: string
          wpp_account_id?: string | null
        }
        Relationships: []
      }
      wpp_messages: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          id: string
          message_id: string | null
          message_type: string | null
          payload: Json | null
          status: string | null
          updated_at: string
          user_id: string
          wa_id: string
          wpp_account_id: string | null
        }
        Insert: {
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          message_type?: string | null
          payload?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
          wa_id: string
          wpp_account_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          message_type?: string | null
          payload?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
          wa_id?: string
          wpp_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wpp_messages_wpp_account_id_fkey"
            columns: ["wpp_account_id"]
            isOneToOne: false
            referencedRelation: "wpp_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      wpp_sessions: {
        Row: {
          chat_id: string
          created_at: string
          current_node_id: string | null
          funnel_id: string | null
          history: Json | null
          id: string
          is_finished: boolean | null
          last_message_at: string | null
          updated_at: string
          user_id: string
          variables: Json | null
          wa_id: string
          wpp_account_id: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string
          current_node_id?: string | null
          funnel_id?: string | null
          history?: Json | null
          id?: string
          is_finished?: boolean | null
          last_message_at?: string | null
          updated_at?: string
          user_id: string
          variables?: Json | null
          wa_id: string
          wpp_account_id?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string
          current_node_id?: string | null
          funnel_id?: string | null
          history?: Json | null
          id?: string
          is_finished?: boolean | null
          last_message_at?: string | null
          updated_at?: string
          user_id?: string
          variables?: Json | null
          wa_id?: string
          wpp_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wpp_sessions_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wpp_sessions_wpp_account_id_fkey"
            columns: ["wpp_account_id"]
            isOneToOne: false
            referencedRelation: "wpp_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      wpp_templates: {
        Row: {
          category: string | null
          components: Json | null
          created_at: string
          id: string
          language: string | null
          status: string | null
          template_id: string | null
          template_name: string
          updated_at: string
          user_id: string
          variables: Json | null
          wpp_account_id: string | null
        }
        Insert: {
          category?: string | null
          components?: Json | null
          created_at?: string
          id?: string
          language?: string | null
          status?: string | null
          template_id?: string | null
          template_name: string
          updated_at?: string
          user_id: string
          variables?: Json | null
          wpp_account_id?: string | null
        }
        Update: {
          category?: string | null
          components?: Json | null
          created_at?: string
          id?: string
          language?: string | null
          status?: string | null
          template_id?: string | null
          template_name?: string
          updated_at?: string
          user_id?: string
          variables?: Json | null
          wpp_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wpp_templates_wpp_account_id_fkey"
            columns: ["wpp_account_id"]
            isOneToOne: false
            referencedRelation: "wpp_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_referrals: { Args: { p_user_id: string }; Returns: boolean }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      reserve_campaign_batch: {
        Args: { p_batch_size: number; p_campaign_id: string }
        Returns: {
          end_offset: number
          start_offset: number
          total_count: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "vendor"
        | "vendor_instagram"
        | "vendor_tiktok"
        | "vendor_model"
        | "indicador"
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
      app_role: [
        "admin",
        "user",
        "vendor",
        "vendor_instagram",
        "vendor_tiktok",
        "vendor_model",
        "indicador",
      ],
      plan_type: ["free", "basic", "pro", "agency"],
      subscription_status: ["active", "pending", "cancelled", "expired"],
      transaction_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
