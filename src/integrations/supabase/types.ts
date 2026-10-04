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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      admin_dispatch_state: {
        Row: {
          donation_watermark: string
          fundraiser_watermark: string
          id: number
          last_run_at: string | null
        }
        Insert: {
          donation_watermark?: string
          fundraiser_watermark?: string
          id?: number
          last_run_at?: string | null
        }
        Update: {
          donation_watermark?: string
          fundraiser_watermark?: string
          id?: number
          last_run_at?: string | null
        }
        Relationships: []
      }
      admin_email_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          last_error: string | null
          payload: Json | null
          resend_id: string | null
          sent_at: string | null
          source_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          last_error?: string | null
          payload?: Json | null
          resend_id?: string | null
          sent_at?: string | null
          source_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          payload?: Json | null
          resend_id?: string | null
          sent_at?: string | null
          source_id?: string
        }
        Relationships: []
      }
      admin_notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id?: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "admin_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          source_key: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          source_key?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          source_key?: string | null
          title?: string
        }
        Relationships: []
      }
      admin_saved_views: {
        Row: {
          created_at: string
          id: string
          module: string
          name: string
          state: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          name: string
          state: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          name?: string
          state?: Json
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          email_new_donation: boolean
          email_new_fundraiser: boolean
          id: number
          notification_recipients: string[]
          require_fundraiser_approval: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          email_new_donation?: boolean
          email_new_fundraiser?: boolean
          id?: number
          notification_recipients?: string[]
          require_fundraiser_approval?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          email_new_donation?: boolean
          email_new_fundraiser?: boolean
          id?: number
          notification_recipients?: string[]
          require_fundraiser_approval?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "admin_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          linked_id: string | null
          linked_type: string | null
          priority: string
          source_key: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          priority?: string
          source_key?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          priority?: string
          source_key?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_attempts: {
        Row: {
          context: string
          conversation_id: string | null
          created_at: string
          fundraiser_id: string | null
          id: string
          masked_excerpt: string | null
          matched_rules: string[]
          sender_id: string
          status: string
        }
        Insert: {
          context?: string
          conversation_id?: string | null
          created_at?: string
          fundraiser_id?: string | null
          id?: string
          masked_excerpt?: string | null
          matched_rules?: string[]
          sender_id: string
          status?: string
        }
        Update: {
          context?: string
          conversation_id?: string | null
          created_at?: string
          fundraiser_id?: string | null
          id?: string
          masked_excerpt?: string | null
          matched_rules?: string[]
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      brand_procurement_map: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          provider: string
          tremendous_product_id: string
          updated_at: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          provider?: string
          tremendous_product_id: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          provider?: string
          tremendous_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      cms_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: string
          created_at: string
          id: string
          section: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_key: string
          content_type?: string
          content_value?: string
          created_at?: string
          id?: string
          section?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: string
          created_at?: string
          id?: string
          section?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cms_faq: {
        Row: {
          answer: string
          category: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          question: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question?: string
        }
        Relationships: []
      }
      cms_posts: {
        Row: {
          author_id: string | null
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_stories: {
        Row: {
          amount_raised: number
          category: string
          created_at: string
          display_order: number
          donors_count: number
          full_story: string | null
          goal: number
          id: string
          image_url: string | null
          impact: string | null
          is_published: boolean
          location: string | null
          name: string
          short_story: string
          updated_at: string
        }
        Insert: {
          amount_raised?: number
          category?: string
          created_at?: string
          display_order?: number
          donors_count?: number
          full_story?: string | null
          goal?: number
          id?: string
          image_url?: string | null
          impact?: string | null
          is_published?: boolean
          location?: string | null
          name: string
          short_story: string
          updated_at?: string
        }
        Update: {
          amount_raised?: number
          category?: string
          created_at?: string
          display_order?: number
          donors_count?: number
          full_story?: string | null
          goal?: number
          id?: string
          image_url?: string | null
          impact?: string | null
          is_published?: boolean
          location?: string | null
          name?: string
          short_story?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_testimonials: {
        Row: {
          consent_at: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_anonymous: boolean
          is_published: boolean
          location: string | null
          name: string
          quote: string
          role: string
          role_label: string
          status: string
          submitted_by: string | null
          submitter_role: string | null
          verified: boolean
        }
        Insert: {
          consent_at?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          is_published?: boolean
          location?: string | null
          name: string
          quote: string
          role?: string
          role_label?: string
          status?: string
          submitted_by?: string | null
          submitter_role?: string | null
          verified?: boolean
        }
        Update: {
          consent_at?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_anonymous?: boolean
          is_published?: boolean
          location?: string | null
          name?: string
          quote?: string
          role?: string
          role_label?: string
          status?: string
          submitted_by?: string | null
          submitter_role?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "fundraiser_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          fundraiser_id: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          fundraiser_id?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          fundraiser_id?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_reads: {
        Row: {
          conversation_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          blocked_by: string | null
          created_at: string
          fundraiser_id: string
          id: string
          last_message_at: string
          status: string
          supporter_id: string
          updated_at: string
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string
          fundraiser_id: string
          id?: string
          last_message_at?: string
          status?: string
          supporter_id: string
          updated_at?: string
        }
        Update: {
          blocked_by?: string | null
          created_at?: string
          fundraiser_id?: string
          id?: string
          last_message_at?: string
          status?: string
          supporter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_claims: {
        Row: {
          claimed_at: string
          coupon_id: string
          id: string
          recipient_id: string
          used_at: string | null
        }
        Insert: {
          claimed_at?: string
          coupon_id: string
          id?: string
          recipient_id: string
          used_at?: string | null
        }
        Update: {
          claimed_at?: string
          coupon_id?: string
          id?: string
          recipient_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_claims_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: true
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_claims_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_procurement_batches: {
        Row: {
          brand_name: string
          coupon_value: number
          created_at: string
          id: string
          name: string | null
          notes: string | null
          total_cost: number | null
          total_count: number
          uploaded_by: string | null
          vendor: string | null
        }
        Insert: {
          brand_name: string
          coupon_value: number
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          total_cost?: number | null
          total_count: number
          uploaded_by?: string | null
          vendor?: string | null
        }
        Update: {
          brand_name?: string
          coupon_value?: number
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          total_cost?: number | null
          total_count?: number
          uploaded_by?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      coupon_receipts: {
        Row: {
          bytes: number | null
          coupon_id: string
          created_at: string
          height: number | null
          hidden_at: string | null
          hidden_by: string | null
          id: string
          storage_path: string
          uploaded_by: string
          width: number | null
        }
        Insert: {
          bytes?: number | null
          coupon_id: string
          created_at?: string
          height?: number | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          storage_path: string
          uploaded_by: string
          width?: number | null
        }
        Update: {
          bytes?: number | null
          coupon_id?: string
          created_at?: string
          height?: number | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          storage_path?: string
          uploaded_by?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_receipts_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_reveal_log: {
        Row: {
          coupon_id: string
          created_at: string
          first_reveal: boolean
          id: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          first_reveal?: boolean
          id?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          first_reveal?: boolean
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_reveal_log_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          batch_id: string | null
          category: string | null
          category_id: string | null
          claimed_at: string | null
          code: string | null
          code_hint: string | null
          created_at: string
          description: string | null
          discount_percent: number | null
          donation_id: string | null
          donor_id: string | null
          expected_value: number | null
          expiry_date: string | null
          id: string
          last_procurement_at: string | null
          last_procurement_error: string | null
          min_purchase: number | null
          partner_id: string | null
          procurement_attempts: number
          redeemed_at: string | null
          redeemed_by: string | null
          redemption_url: string | null
          reserved_at: string | null
          reserved_by: string | null
          returned_at: string | null
          returned_from_coupon_id: string | null
          returned_from_fundraiser_id: string | null
          reveal_reminder_sent_at: string | null
          revealed_at: string | null
          revealed_by: string | null
          status: Database["public"]["Enums"]["coupon_status"]
          store_name: string
          title: string
          tremendous_order_id: string | null
          tremendous_reward_id: string | null
          updated_at: string
          used_at: string | null
          used_category: string | null
          used_note: string | null
          used_source: string | null
          value: number | null
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          batch_id?: string | null
          category?: string | null
          category_id?: string | null
          claimed_at?: string | null
          code?: string | null
          code_hint?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          donation_id?: string | null
          donor_id?: string | null
          expected_value?: number | null
          expiry_date?: string | null
          id?: string
          last_procurement_at?: string | null
          last_procurement_error?: string | null
          min_purchase?: number | null
          partner_id?: string | null
          procurement_attempts?: number
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_url?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          returned_at?: string | null
          returned_from_coupon_id?: string | null
          returned_from_fundraiser_id?: string | null
          reveal_reminder_sent_at?: string | null
          revealed_at?: string | null
          revealed_by?: string | null
          status?: Database["public"]["Enums"]["coupon_status"]
          store_name: string
          title: string
          tremendous_order_id?: string | null
          tremendous_reward_id?: string | null
          updated_at?: string
          used_at?: string | null
          used_category?: string | null
          used_note?: string | null
          used_source?: string | null
          value?: number | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          batch_id?: string | null
          category?: string | null
          category_id?: string | null
          claimed_at?: string | null
          code?: string | null
          code_hint?: string | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          donation_id?: string | null
          donor_id?: string | null
          expected_value?: number | null
          expiry_date?: string | null
          id?: string
          last_procurement_at?: string | null
          last_procurement_error?: string | null
          min_purchase?: number | null
          partner_id?: string | null
          procurement_attempts?: number
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_url?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          returned_at?: string | null
          returned_from_coupon_id?: string | null
          returned_from_fundraiser_id?: string | null
          reveal_reminder_sent_at?: string | null
          revealed_at?: string | null
          revealed_by?: string | null
          status?: Database["public"]["Enums"]["coupon_status"]
          store_name?: string
          title?: string
          tremendous_order_id?: string | null
          tremendous_reward_id?: string | null
          updated_at?: string
          used_at?: string | null
          used_category?: string | null
          used_note?: string | null
          used_source?: string | null
          value?: number | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "coupon_procurement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_brands: {
        Row: {
          allocated_amount: number
          allocation_percent: number
          brand_name: string
          created_at: string
          donation_id: string
          id: string
        }
        Insert: {
          allocated_amount: number
          allocation_percent: number
          brand_name: string
          created_at?: string
          donation_id: string
          id?: string
        }
        Update: {
          allocated_amount?: number
          allocation_percent?: number
          brand_name?: string
          created_at?: string
          donation_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_brands_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_impact_tokens: {
        Row: {
          created_at: string
          donation_id: string
          expires_at: string
          id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          donation_id: string
          expires_at: string
          id?: string
          token_hash: string
        }
        Update: {
          created_at?: string
          donation_id?: string
          expires_at?: string
          id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_impact_tokens_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          brand_partner: string | null
          category_id: string | null
          created_at: string
          currency: string | null
          decline_reason: string | null
          donor_email: string | null
          donor_id: string | null
          donor_name: string | null
          fundraiser_id: string | null
          id: string
          is_anonymous: boolean | null
          message: string | null
          net_amount: number | null
          payment_method: string | null
          payment_provider: string | null
          receipt_url: string | null
          region: string | null
          status: string | null
          stripe_fee: number | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount: number
          brand_partner?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          decline_reason?: string | null
          donor_email?: string | null
          donor_id?: string | null
          donor_name?: string | null
          fundraiser_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          net_amount?: number | null
          payment_method?: string | null
          payment_provider?: string | null
          receipt_url?: string | null
          region?: string | null
          status?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          brand_partner?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          decline_reason?: string | null
          donor_email?: string | null
          donor_id?: string | null
          donor_name?: string | null
          fundraiser_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          net_amount?: number | null
          payment_method?: string | null
          payment_provider?: string | null
          receipt_url?: string | null
          region?: string | null
          status?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_impact_events: {
        Row: {
          coupon_id: string
          created_at: string
          donation_id: string
          emailed_at: string | null
          id: string
          kind: string
          last_error: string | null
          resend_id: string | null
          skipped_reason: string | null
        }
        Insert: {
          coupon_id: string
          created_at?: string
          donation_id: string
          emailed_at?: string | null
          id?: string
          kind: string
          last_error?: string | null
          resend_id?: string | null
          skipped_reason?: string | null
        }
        Update: {
          coupon_id?: string
          created_at?: string
          donation_id?: string
          emailed_at?: string | null
          id?: string
          kind?: string
          last_error?: string | null
          resend_id?: string | null
          skipped_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_impact_events_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_impact_events_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_type: string
          created_at: string
          created_by: string | null
          html_content: string
          id: string
          preview_text: string | null
          reply_to: string | null
          scheduled_for: string | null
          segment_id: string | null
          sender_email: string
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
          template_id: string | null
          test_recipients: string[] | null
          total_recipients: number
          tracking_enabled: boolean
          updated_at: string
        }
        Insert: {
          audience_type?: string
          created_at?: string
          created_by?: string | null
          html_content?: string
          id?: string
          preview_text?: string | null
          reply_to?: string | null
          scheduled_for?: string | null
          segment_id?: string | null
          sender_email?: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject: string
          template_id?: string | null
          test_recipients?: string[] | null
          total_recipients?: number
          tracking_enabled?: boolean
          updated_at?: string
        }
        Update: {
          audience_type?: string
          created_at?: string
          created_by?: string | null
          html_content?: string
          id?: string
          preview_text?: string | null
          reply_to?: string | null
          scheduled_for?: string | null
          segment_id?: string | null
          sender_email?: string
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          template_id?: string | null
          test_recipients?: string[] | null
          total_recipients?: number
          tracking_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "email_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          recipient_email: string | null
          subscriber_id: string | null
          url: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          recipient_email?: string | null
          subscriber_id?: string | null
          url?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string | null
          subscriber_id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      email_segments: {
        Row: {
          created_at: string
          description: string | null
          filter_spec: Json
          id: string
          last_count: number | null
          last_resolved_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          filter_spec?: Json
          id?: string
          last_count?: number | null
          last_resolved_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          filter_spec?: Json
          id?: string
          last_count?: number | null
          last_resolved_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          engagement_score: number | null
          id: string
          last_click_at: string | null
          last_open_at: string | null
          name: string | null
          source: string
          subscribed: boolean
          subscribed_at: string
          tags: string[] | null
          unsubscribe_token: string
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          engagement_score?: number | null
          id?: string
          last_click_at?: string | null
          last_open_at?: string | null
          name?: string | null
          source?: string
          subscribed?: boolean
          subscribed_at?: string
          tags?: string[] | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          engagement_score?: number | null
          id?: string
          last_click_at?: string | null
          last_open_at?: string | null
          name?: string | null
          source?: string
          subscribed?: boolean
          subscribed_at?: string
          tags?: string[] | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          created_by: string | null
          html_content: string
          id: string
          name: string
          preview_text: string | null
          subject: string
          tokens: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          html_content?: string
          id?: string
          name: string
          preview_text?: string | null
          subject: string
          tokens?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          html_content?: string
          id?: string
          name?: string
          preview_text?: string | null
          subject?: string
          tokens?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      featured_stories: {
        Row: {
          amount_raised: number
          brand_partners: string[] | null
          category: string
          created_at: string
          display_order: number
          donors_count: number
          full_story: string | null
          goal: number
          headline: string
          id: string
          impact: string | null
          is_active: boolean
          location: string
          name: string
          short_story: string
          story_key: string
          updated_at: string
        }
        Insert: {
          amount_raised?: number
          brand_partners?: string[] | null
          category?: string
          created_at?: string
          display_order?: number
          donors_count?: number
          full_story?: string | null
          goal?: number
          headline?: string
          id?: string
          impact?: string | null
          is_active?: boolean
          location?: string
          name: string
          short_story?: string
          story_key: string
          updated_at?: string
        }
        Update: {
          amount_raised?: number
          brand_partners?: string[] | null
          category?: string
          created_at?: string
          display_order?: number
          donors_count?: number
          full_story?: string | null
          goal?: number
          headline?: string
          id?: string
          impact?: string | null
          is_active?: boolean
          location?: string
          name?: string
          short_story?: string
          story_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      fundraiser_comments: {
        Row: {
          body: string
          created_at: string
          display_name: string
          fundraiser_id: string
          hidden_by: string | null
          id: string
          is_hidden: boolean
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name: string
          fundraiser_id: string
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          fundraiser_id?: string
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_comments_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraiser_images: {
        Row: {
          created_at: string | null
          display_order: number
          fundraiser_id: string
          id: string
          image_url: string
          is_primary: boolean | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          fundraiser_id: string
          id?: string
          image_url: string
          is_primary?: boolean | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          fundraiser_id?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_images_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraiser_team: {
        Row: {
          created_at: string
          fundraiser_id: string
          id: string
          invite_email: string | null
          invite_token_hash: string | null
          invited_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          fundraiser_id: string
          id?: string
          invite_email?: string | null
          invite_token_hash?: string | null
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          fundraiser_id?: string
          id?: string
          invite_email?: string | null
          invite_token_hash?: string | null
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_team_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraiser_updates: {
        Row: {
          author_id: string
          body: string
          created_at: string
          fundraiser_id: string
          id: string
          image_url: string | null
          notify_donors: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          fundraiser_id: string
          id?: string
          image_url?: string | null
          notify_donors?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          fundraiser_id?: string
          id?: string
          image_url?: string | null
          notify_donors?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_updates_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraisers: {
        Row: {
          allow_messages: boolean
          amount_raised: number | null
          archived_at: string | null
          archived_by: string | null
          beneficiary_display_name: string | null
          beneficiary_type: string
          category: string
          country: string | null
          cover_photo_url: string | null
          created_at: string | null
          donors_count: number | null
          featured_order: number | null
          id: string
          is_long_term: boolean | null
          monthly_goal: number
          rejection_reason: string | null
          show_beneficiary_name: boolean
          show_full_name: boolean
          status: string | null
          story: string
          title: string
          unique_slug: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          allow_messages?: boolean
          amount_raised?: number | null
          archived_at?: string | null
          archived_by?: string | null
          beneficiary_display_name?: string | null
          beneficiary_type: string
          category: string
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          donors_count?: number | null
          featured_order?: number | null
          id?: string
          is_long_term?: boolean | null
          monthly_goal: number
          rejection_reason?: string | null
          show_beneficiary_name?: boolean
          show_full_name?: boolean
          status?: string | null
          story: string
          title: string
          unique_slug?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          allow_messages?: boolean
          amount_raised?: number | null
          archived_at?: string | null
          archived_by?: string | null
          beneficiary_display_name?: string | null
          beneficiary_type?: string
          category?: string
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          donors_count?: number | null
          featured_order?: number | null
          id?: string
          is_long_term?: boolean | null
          monthly_goal?: number
          rejection_reason?: string | null
          show_beneficiary_name?: boolean
          show_full_name?: boolean
          status?: string | null
          story?: string
          title?: string
          unique_slug?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      gift_codes: {
        Row: {
          amount: number
          claimed_at: string | null
          claimed_by: string | null
          code: string
          created_at: string | null
          donation_id: string | null
          donor_id: string | null
          donor_name: string | null
          expires_at: string | null
          id: string
          message: string | null
          recipient_email: string | null
          status: string | null
        }
        Insert: {
          amount: number
          claimed_at?: string | null
          claimed_by?: string | null
          code: string
          created_at?: string | null
          donation_id?: string | null
          donor_id?: string | null
          donor_name?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          recipient_email?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string | null
          donation_id?: string | null
          donor_id?: string | null
          donor_name?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          recipient_email?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_codes_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      gold_coin_ledger: {
        Row: {
          coins: number
          created_at: string
          credited_at: string | null
          donation_id: string
          donor_email: string | null
          entry_type: string
          id: string
          needs_review: boolean
          note: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          coins: number
          created_at?: string
          credited_at?: string | null
          donation_id: string
          donor_email?: string | null
          entry_type?: string
          id?: string
          needs_review?: boolean
          note?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          coins?: number
          created_at?: string
          credited_at?: string | null
          donation_id?: string
          donor_email?: string | null
          entry_type?: string
          id?: string
          needs_review?: boolean
          note?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      impact_email_optouts: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      loyalty_cards: {
        Row: {
          card_number: string
          coupons_redeemed: number | null
          created_at: string | null
          id: string
          points_balance: number | null
          total_savings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_number: string
          coupons_redeemed?: number | null
          created_at?: string | null
          id?: string
          points_balance?: number | null
          total_savings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_number?: string
          coupons_redeemed?: number | null
          created_at?: string | null
          id?: string
          points_balance?: number | null
          total_savings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          flags: string[]
          id: string
          ref_coupon_id: string | null
          ref_donation_id: string | null
          ref_label: string | null
          sender_id: string
          status: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          flags?: string[]
          id?: string
          ref_coupon_id?: string | null
          ref_donation_id?: string | null
          ref_label?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          flags?: string[]
          id?: string
          ref_coupon_id?: string | null
          ref_donation_id?: string | null
          ref_label?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_preferences: {
        Row: {
          email_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          email_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          email_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          created_at: string
          fundraiser_id: string | null
          id: string
          kind: string
          recipient_user_id: string
          ref_id: string | null
          scheduled_for: string
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          fundraiser_id?: string | null
          id?: string
          kind: string
          recipient_user_id: string
          ref_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          fundraiser_id?: string | null
          id?: string
          kind?: string
          recipient_user_id?: string
          ref_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      partner_inquiries: {
        Row: {
          city_state: string | null
          contact_name: string
          created_at: string
          email: string
          families_count: number | null
          id: string
          message: string | null
          org_name: string
          org_type: string
          status: string
        }
        Insert: {
          city_state?: string | null
          contact_name: string
          created_at?: string
          email: string
          families_count?: number | null
          id?: string
          message?: string | null
          org_name: string
          org_type: string
          status?: string
        }
        Update: {
          city_state?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          families_count?: number | null
          id?: string
          message?: string | null
          org_name?: string
          org_type?: string
          status?: string
        }
        Relationships: []
      }
      partner_rate_limits: {
        Row: {
          created_at: string
          id: number
          ip_hash: string
        }
        Insert: {
          created_at?: string
          id?: number
          ip_hash: string
        }
        Update: {
          created_at?: string
          id?: number
          ip_hash?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          id: number
          square_enabled: boolean
          stripe_enabled: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          square_enabled?: boolean
          stripe_enabled?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          square_enabled?: boolean
          stripe_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receipt_requests: {
        Row: {
          conversation_id: string | null
          coupon_id: string
          created_at: string
          donation_id: string
          requested_by: string
        }
        Insert: {
          conversation_id?: string | null
          coupon_id: string
          created_at?: string
          donation_id: string
          requested_by: string
        }
        Update: {
          conversation_id?: string | null
          coupon_id?: string
          created_at?: string
          donation_id?: string
          requested_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_requests_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: true
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_requests_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      recipient_applications: {
        Row: {
          admin_notes: string | null
          application_type: string
          assistance_type: string
          campaign_photos: string[] | null
          campaign_title: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          full_name: string
          funding_goal: number | null
          household_size: number | null
          id: string
          phone: string | null
          photo_url: string | null
          referral_source: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          story: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          application_type: string
          assistance_type: string
          campaign_photos?: string[] | null
          campaign_title?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          full_name: string
          funding_goal?: number | null
          household_size?: number | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          story: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          application_type?: string
          assistance_type?: string
          campaign_photos?: string[] | null
          campaign_title?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          funding_goal?: number | null
          household_size?: number | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          referral_source?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          story?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      recipient_verifications: {
        Row: {
          admin_notes: string | null
          annual_income: number | null
          documents_url: string | null
          government_id_url: string | null
          household_size: number | null
          id: string
          income_document_url: string | null
          notes: string | null
          organization_contact: string | null
          organization_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          user_id: string
          verification_type: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          annual_income?: number | null
          documents_url?: string | null
          government_id_url?: string | null
          household_size?: number | null
          id?: string
          income_document_url?: string | null
          notes?: string | null
          organization_contact?: string | null
          organization_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id: string
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          annual_income?: number | null
          documents_url?: string | null
          government_id_url?: string | null
          household_size?: number | null
          id?: string
          income_document_url?: string | null
          notes?: string | null
          organization_contact?: string | null
          organization_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      redemption_history: {
        Row: {
          coupon_id: string | null
          id: string
          points_earned: number | null
          redeemed_at: string
          savings_amount: number | null
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          id?: string
          points_earned?: number | null
          redeemed_at?: string
          savings_amount?: number | null
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          id?: string
          points_earned?: number | null
          redeemed_at?: string
          savings_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemption_history_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _check_code: { Args: { _code: string; _url: string }; Returns: undefined }
      _donation_impact: { Args: { _donation_id: string }; Returns: Json }
      _gc_apply: { Args: { _delta: number; _uid: string }; Returns: number }
      _give_stock: {
        Args: { _stock: string; _target: string }
        Returns: string
      }
      _impact_token_donation: { Args: { _hash: string }; Returns: string }
      _is_donation_donor: {
        Args: { _donation_id: string; _uid: string }
        Returns: boolean
      }
      _mask_code: { Args: { _c: string }; Returns: string }
      _owner_mark_coupon_used: {
        Args: {
          _category: string
          _coupon_id: string
          _note: string
          _uid: string
        }
        Returns: Json
      }
      _preserve_code: {
        Args: { _cid: string; _reason: string }
        Returns: string
      }
      admin_add_stock_codes: {
        Args: {
          _batch?: Json
          _brand: string
          _codes: string[]
          _expiry?: string
          _url?: string
          _value: number
        }
        Returns: Json
      }
      admin_analytics: { Args: { _days?: number }; Returns: Json }
      admin_assign_stock_code: {
        Args: { _stock: string; _target: string }
        Returns: string
      }
      admin_auto_task: {
        Args: {
          _id: string
          _key: string
          _link: string
          _priority: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      admin_code_usage: {
        Args: {
          _limit?: number
          _offset?: number
          _search?: string
          _state?: string
        }
        Returns: {
          batch_name: string
          code_hint: string
          created_at: string
          donation_id: string
          expiry_date: string
          fundraiser_id: string
          fundraiser_title: string
          given_at: string
          id: string
          redemption_url: string
          state: string
          store_name: string
          total_count: number
          used_at: string
          value: number
        }[]
      }
      admin_delete_stock_code: { Args: { _id: string }; Returns: undefined }
      admin_edit_stock_code: {
        Args: { _id: string; _patch: Json }
        Returns: undefined
      }
      admin_email_stats: { Args: never; Returns: Json }
      admin_fill_from_stock: {
        Args: { _brand: string; _limit?: number; _value: number }
        Returns: {
          coupon_ids: string[]
          fundraiser_id: string
        }[]
      }
      admin_fundraiser_action: {
        Args: {
          _action: string
          _id: string
          _order?: number
          _reason?: string
        }
        Returns: undefined
      }
      admin_fundraiser_coupons: {
        Args: { _fundraiser_id: string }
        Returns: {
          code_hint: string
          donation_at: string
          donation_id: string
          has_code: boolean
          id: string
          redemption_url: string
          status: string
          store_name: string
          updated_at: string
          value: number
        }[]
      }
      admin_hard_delete_fundraiser: {
        Args: { _confirm: string; _id: string }
        Returns: undefined
      }
      admin_hide_receipt: {
        Args: { _hidden?: boolean; _receipt_id: string }
        Returns: undefined
      }
      admin_import_profile_subscribers: { Args: never; Returns: number }
      admin_inventory_summary: {
        Args: never
        Returns: {
          expired: number
          given: number
          in_stock: number
          returned: number
          store_name: string
          used: number
          value: number
          waiting: number
        }[]
      }
      admin_list_donors: {
        Args: {
          _limit?: number
          _offset?: number
          _search?: string
          _sort?: string
        }
        Returns: {
          any_anonymous: boolean
          display_name: string
          donations_count: number
          donor_id: string
          donor_key: string
          email: string
          first_at: string
          fundraisers_supported: number
          last_at: string
          total: number
          total_count: number
        }[]
      }
      admin_list_team: {
        Args: never
        Returns: {
          email: string
          full_name: string
          roles: string[]
          user_id: string
        }[]
      }
      admin_list_users: {
        Args: {
          _limit?: number
          _offset?: number
          _role?: string
          _search?: string
        }
        Returns: {
          city: string
          country: string
          created_at: string
          email: string
          full_name: string
          roles: string[]
          total_count: number
          user_id: string
        }[]
      }
      admin_mark_coupon_used: {
        Args: { _id: string; _used: boolean }
        Returns: undefined
      }
      admin_overview_kpis: { Args: never; Returns: Json }
      admin_procurement_groups: {
        Args: never
        Returns: {
          n: number
          oldest: string
          store_name: string
          value: number
        }[]
      }
      admin_resplit_coupons: {
        Args: { _brand: string; _donation_id: string; _values: number[] }
        Returns: number
      }
      admin_returned_code_action: {
        Args: { _action: string; _id: string }
        Returns: undefined
      }
      admin_reveal_code: { Args: { _id: string }; Returns: string }
      admin_save_coupon_group: {
        Args: { _brand: string; _donation_id: string; _items: Json }
        Returns: string[]
      }
      admin_search: {
        Args: { _q: string }
        Returns: {
          id: string
          kind: string
          label: string
          link: string
          sub: string
        }[]
      }
      admin_set_coupon_code: {
        Args: { _code: string; _coupon_id: string; _redemption_url?: string }
        Returns: Json
      }
      admin_set_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["user_role"]
          _user: string
        }
        Returns: undefined
      }
      admin_update_fundraiser: {
        Args: { _id: string; _patch: Json }
        Returns: undefined
      }
      admin_update_settings: { Args: { _patch: Json }; Returns: undefined }
      admin_view_conversation: {
        Args: { _cid: string }
        Returns: {
          body: string
          created_at: string
          id: string
          sender_id: string
          status: string
        }[]
      }
      admin_write: {
        Args: { _ids?: string[]; _op: string; _patch?: Json; _table: string }
        Returns: Json
      }
      apply_donation_to_fundraiser: {
        Args: {
          _amount: number
          _donor_email: string
          _donor_id: string
          _fundraiser_id: string
        }
        Returns: undefined
      }
      attach_procured_codes: {
        Args: { _brand: string; _codes: string[]; _value: number }
        Returns: number
      }
      can_access_conversation: {
        Args: { _cid: string; _uid: string }
        Returns: boolean
      }
      can_view_coupon_receipts: {
        Args: { _coupon_id: string; _uid: string }
        Returns: boolean
      }
      claim_available_coupon: {
        Args: { _coupon_id: string }
        Returns: undefined
      }
      claim_gold_coins: { Args: never; Returns: number }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      cleanup_expired_password_reset_tokens: { Args: never; Returns: undefined }
      confirm_coupon_redemption: {
        Args: { _coupon_id: string }
        Returns: undefined
      }
      credit_gold_coins: { Args: never; Returns: Json }
      dispatch_secret_ok: { Args: { _s: string }; Returns: boolean }
      generate_card_number: { Args: never; Returns: string }
      get_completed_fundraisers: {
        Args: never
        Returns: {
          category: string
          coupons_issued: number
          coupons_redeemed: number
          cover_photo_url: string
          goal: number
          id: string
          raised: number
          title: string
          unique_slug: string
        }[]
      }
      get_coupon_code: { Args: { _coupon_id: string }; Returns: string }
      get_coupon_secret: {
        Args: { _coupon_id: string }
        Returns: {
          code: string
          redemption_url: string
        }[]
      }
      get_donation_impact: { Args: { _donation_id: string }; Returns: Json }
      get_fundraiser_coupon_trail: {
        Args: { _fundraiser_id: string }
        Returns: {
          converted: number
          coupons_count: number
          redeemed: number
        }[]
      }
      get_fundraiser_donations: {
        Args: { _fundraiser_id: string; _limit?: number; _order?: string }
        Returns: {
          amount: number
          created_at: string
          display_name: string
          id: string
          is_anonymous: boolean
          message: string
        }[]
      }
      get_fundraiser_organizer: {
        Args: { _fundraiser_id: string }
        Returns: {
          city: string
          country: string
          display_name: string
        }[]
      }
      get_fundraiser_team_public: {
        Args: { _fundraiser_id: string }
        Returns: {
          city: string
          country: string
          display_name: string
          role: string
        }[]
      }
      get_fundraiser_totals: {
        Args: { _fundraiser_id: string }
        Returns: {
          donations_count: number
          retailers: string[]
          total_raised: number
        }[]
      }
      get_impact_stats: {
        Args: never
        Returns: {
          active_fundraisers: number
          donations_today: number
          raised_today: number
          total_coupons: number
          total_donations: number
          total_raised: number
        }[]
      }
      get_landing_stats: { Args: never; Returns: Json }
      get_my_fundraiser_coupons: {
        Args: { _fundraiser_id: string }
        Returns: {
          can_reveal: boolean
          code: string
          donation_id: string
          id: string
          receipt_count: number
          redemption_url: string
          revealed_at: string
          status: string
          store_name: string
          used_at: string
          used_category: string
          used_note: string
          value: number
        }[]
      }
      get_proof_stats: { Args: never; Returns: Json }
      get_public_donation_stats: {
        Args: never
        Returns: {
          donations_count: number
          total_raised: number
        }[]
      }
      get_recent_public_donations: {
        Args: { _limit?: number }
        Returns: {
          amount: number
          brand_partner: string
          created_at: string
          display_name: string
          id: string
        }[]
      }
      get_top_donors_week: {
        Args: never
        Returns: {
          display_name: string
          donations_count: number
          is_anonymous: boolean
          total: number
        }[]
      }
      has_completed_donation: {
        Args: { _fid: string; _uid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_any: { Args: { _uid: string }; Returns: boolean }
      is_admin_staff: { Args: { _uid: string }; Returns: boolean }
      is_fundraiser_organizer: {
        Args: { _fid: string; _uid: string }
        Returns: boolean
      }
      is_fundraiser_team: {
        Args: { _fid: string; _uid: string }
        Returns: boolean
      }
      list_available_coupons: {
        Args: never
        Returns: {
          created_at: string
          description: string
          expiry_date: string
          id: string
          status: string
          store_name: string
          title: string
          value: number
        }[]
      }
      log_admin_action: {
        Args: {
          _action: string
          _after: Json
          _before: Json
          _record: string
          _table: string
        }
        Returns: undefined
      }
      owner_reveal_coupon: { Args: { _coupon_id: string }; Returns: Json }
      set_comment_hidden: {
        Args: { _comment_id: string; _hidden: boolean }
        Returns: undefined
      }
      short_display_name: { Args: { _name: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "donor" | "recipient"
      coupon_status:
        | "available"
        | "reserved"
        | "redeemed"
        | "expired"
        | "pending_procurement"
        | "claimed"
        | "procurement_failed"
        | "in_stock"
        | "returned"
        | "void"
      user_role: "recipient" | "donor" | "admin" | "staff" | "viewer"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "donor", "recipient"],
      coupon_status: [
        "available",
        "reserved",
        "redeemed",
        "expired",
        "pending_procurement",
        "claimed",
        "procurement_failed",
        "in_stock",
        "returned",
        "void",
      ],
      user_role: ["recipient", "donor", "admin", "staff", "viewer"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
