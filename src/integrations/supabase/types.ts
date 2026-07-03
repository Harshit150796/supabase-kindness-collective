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
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_published: boolean
          location: string | null
          name: string
          quote: string
          role: string
          role_label: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string | null
          name: string
          quote: string
          role?: string
          role_label?: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string | null
          name?: string
          quote?: string
          role?: string
          role_label?: string
          verified?: boolean
        }
        Relationships: []
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
          notes?: string | null
          total_cost?: number | null
          total_count?: number
          uploaded_by?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          category: string | null
          category_id: string | null
          claimed_at: string | null
          code: string | null
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
          status: Database["public"]["Enums"]["coupon_status"]
          store_name: string
          title: string
          tremendous_order_id: string | null
          tremendous_reward_id: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          claimed_at?: string | null
          code?: string | null
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
          status?: Database["public"]["Enums"]["coupon_status"]
          store_name: string
          title: string
          tremendous_order_id?: string | null
          tremendous_reward_id?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          claimed_at?: string | null
          code?: string | null
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
          status?: Database["public"]["Enums"]["coupon_status"]
          store_name?: string
          title?: string
          tremendous_order_id?: string | null
          tremendous_reward_id?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: [
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
      fundraisers: {
        Row: {
          amount_raised: number | null
          beneficiary_type: string
          category: string
          country: string | null
          cover_photo_url: string | null
          created_at: string | null
          donors_count: number | null
          id: string
          is_long_term: boolean | null
          monthly_goal: number
          status: string | null
          story: string
          title: string
          unique_slug: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          amount_raised?: number | null
          beneficiary_type: string
          category: string
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          donors_count?: number | null
          id?: string
          is_long_term?: boolean | null
          monthly_goal: number
          status?: string | null
          story: string
          title: string
          unique_slug?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          amount_raised?: number | null
          beneficiary_type?: string
          category?: string
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          donors_count?: number | null
          id?: string
          is_long_term?: boolean | null
          monthly_goal?: number
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
      cleanup_expired_otps: { Args: never; Returns: undefined }
      cleanup_expired_password_reset_tokens: { Args: never; Returns: undefined }
      confirm_coupon_redemption: {
        Args: { _coupon_id: string }
        Returns: undefined
      }
      generate_card_number: { Args: never; Returns: string }
      get_coupon_code: { Args: { _coupon_id: string }; Returns: string }
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
      get_top_donors_week: {
        Args: never
        Returns: {
          display_name: string
          donations_count: number
          is_anonymous: boolean
          total: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      user_role: "recipient" | "donor" | "admin"
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
      app_role: ["admin", "donor", "recipient"],
      coupon_status: [
        "available",
        "reserved",
        "redeemed",
        "expired",
        "pending_procurement",
        "claimed",
        "procurement_failed",
      ],
      user_role: ["recipient", "donor", "admin"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
