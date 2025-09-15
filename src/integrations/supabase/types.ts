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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          organization_id: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          organization_id: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          organization_id: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          organization_id: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          created_at: string
          dns_verified_at: string | null
          domain: string
          id: string
          is_primary: boolean | null
          organization_id: string
          ssl_issued_at: string | null
          ssl_status: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          created_at?: string
          dns_verified_at?: string | null
          domain: string
          id?: string
          is_primary?: boolean | null
          organization_id: string
          ssl_issued_at?: string | null
          ssl_status?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          created_at?: string
          dns_verified_at?: string | null
          domain?: string
          id?: string
          is_primary?: boolean | null
          organization_id?: string
          ssl_issued_at?: string | null
          ssl_status?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      customer_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          organization_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          organization_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          organization_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          minimum_order_amount: number | null
          organization_id: string
          type: string
          updated_at: string
          usage_limit: number | null
          used_count: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_order_amount?: number | null
          organization_id: string
          type: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_order_amount?: number | null
          organization_id?: string
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_verification_records: {
        Row: {
          created_at: string
          custom_domain_id: string
          id: string
          is_verified: boolean | null
          record_name: string
          record_type: string
          record_value: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          custom_domain_id: string
          id?: string
          is_verified?: boolean | null
          record_name: string
          record_type: string
          record_value: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          custom_domain_id?: string
          id?: string
          is_verified?: boolean | null
          record_name?: string
          record_type?: string
          record_value?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          created_at: string
          delay_hours: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          sequence_order: number | null
          subject: string
          template_id: string | null
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          sequence_order?: number | null
          subject: string
          template_id?: string | null
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          sequence_order?: number | null
          subject?: string
          template_id?: string | null
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "email_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          send_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          send_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          send_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      email_segments: {
        Row: {
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          conditions: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          campaign_id: string | null
          created_at: string
          delivered_at: string | null
          id: string
          organization_id: string
          resend_email_id: string | null
          sent_at: string
          status: string | null
          subject: string
          subscriber_id: string
          template_id: string | null
          workflow_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          organization_id: string
          resend_email_id?: string | null
          sent_at?: string
          status?: string | null
          subject: string
          subscriber_id: string
          template_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          organization_id?: string
          resend_email_id?: string | null
          sent_at?: string
          status?: string | null
          subject?: string
          subscriber_id?: string
          template_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "email_subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "email_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          created_at: string
          custom_fields: Json | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          organization_id: string
          phone: string | null
          subscribed_at: string
          subscription_source: string | null
          tags: string[] | null
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custom_fields?: Json | null
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          organization_id: string
          phone?: string | null
          subscribed_at?: string
          subscription_source?: string | null
          tags?: string[] | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custom_fields?: Json | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          organization_id?: string
          phone?: string | null
          subscribed_at?: string
          subscription_source?: string | null
          tags?: string[] | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          content: Json
          created_at: string
          html_content: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          subject: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_workflows: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string
          workflow_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string
          workflow_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string
          workflow_type?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          organization_id: string
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          bucket_name: string
          caption: string | null
          category: string | null
          created_at: string
          file_size: number | null
          file_type: string | null
          file_url: string
          filename: string
          id: string
          organization_id: string
          original_filename: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          bucket_name: string
          caption?: string | null
          category?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          filename: string
          id?: string
          organization_id: string
          original_filename?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          bucket_name?: string
          caption?: string | null
          category?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          filename?: string
          id?: string
          organization_id?: string
          original_filename?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_sku?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
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
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address_line1: string
          billing_address_line2: string | null
          billing_city: string
          billing_country: string
          billing_first_name: string
          billing_last_name: string
          billing_phone: string | null
          billing_postal_code: string
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          organization_id: string
          shipped_at: string | null
          shipping_address_line1: string
          shipping_address_line2: string | null
          shipping_amount: number | null
          shipping_city: string
          shipping_country: string
          shipping_first_name: string
          shipping_last_name: string
          shipping_phone: string | null
          shipping_postal_code: string
          status: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address_line1: string
          billing_address_line2?: string | null
          billing_city: string
          billing_country?: string
          billing_first_name: string
          billing_last_name: string
          billing_phone?: string | null
          billing_postal_code: string
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          organization_id: string
          shipped_at?: string | null
          shipping_address_line1: string
          shipping_address_line2?: string | null
          shipping_amount?: number | null
          shipping_city: string
          shipping_country?: string
          shipping_first_name: string
          shipping_last_name: string
          shipping_phone?: string | null
          shipping_postal_code: string
          status?: string
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address_line1?: string
          billing_address_line2?: string | null
          billing_city?: string
          billing_country?: string
          billing_first_name?: string
          billing_last_name?: string
          billing_phone?: string | null
          billing_postal_code?: string
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          organization_id?: string
          shipped_at?: string | null
          shipping_address_line1?: string
          shipping_address_line2?: string | null
          shipping_amount?: number | null
          shipping_city?: string
          shipping_country?: string
          shipping_first_name?: string
          shipping_last_name?: string
          shipping_phone?: string | null
          shipping_postal_code?: string
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          description: string | null
          domain: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          slug: string
          subdomain: string | null
          subscription_plan: string | null
          subscription_status: string | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          slug: string
          subdomain?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          slug?: string
          subdomain?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          attribute_type: string
          created_at: string
          id: string
          name: string
          product_id: string
          sort_order: number | null
          value: string
        }
        Insert: {
          attribute_type: string
          created_at?: string
          id?: string
          name: string
          product_id: string
          sort_order?: number | null
          value: string
        }
        Update: {
          attribute_type?: string
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_collections: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_collections_collection_id"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_collections_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number | null
          product_id: string
          updated_at: string
          values: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number | null
          product_id: string
          updated_at?: string
          values?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number | null
          product_id?: string
          updated_at?: string
          values?: string[]
        }
        Relationships: []
      }
      product_tags: {
        Row: {
          created_at: string
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          barcode: string | null
          compare_at_price: number | null
          created_at: string
          id: string
          image_url: string | null
          inventory_quantity: number | null
          is_active: boolean | null
          option_values: Json
          position: number | null
          price: number
          product_id: string
          sku: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          inventory_quantity?: number | null
          is_active?: boolean | null
          option_values?: Json
          position?: number | null
          price: number
          product_id: string
          sku?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          inventory_quantity?: number | null
          is_active?: boolean | null
          option_values?: Json
          position?: number | null
          price?: number
          product_id?: string
          sku?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          dimensions_height: number | null
          dimensions_length: number | null
          dimensions_width: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          is_sale: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          organization_id: string
          original_price: number | null
          price: number
          product_type: string | null
          short_description: string | null
          sku: string | null
          slug: string
          stock_quantity: number | null
          updated_at: string
          vendor: string | null
          weight: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_width?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_sale?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          organization_id: string
          original_price?: number | null
          price: number
          product_type?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          stock_quantity?: number | null
          updated_at?: string
          vendor?: string | null
          weight?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          dimensions_height?: number | null
          dimensions_length?: number | null
          dimensions_width?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_sale?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          organization_id?: string
          original_price?: number | null
          price?: number
          product_type?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock_quantity?: number | null
          updated_at?: string
          vendor?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          organization_id: string
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          organization_id: string
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          organization_id?: string
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_cart: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          setting_type: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          setting_type: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          setting_type?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      store_templates: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          preview_image_url: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          preview_image_url?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          preview_image_url?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_settings: {
        Row: {
          appearance_settings: Json
          created_at: string
          id: string
          is_active: boolean | null
          organization_id: string
          seo_settings: Json
          theme_name: string
          updated_at: string
        }
        Insert: {
          appearance_settings?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          seo_settings?: Json
          theme_name?: string
          updated_at?: string
        }
        Update: {
          appearance_settings?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          seo_settings?: Json
          theme_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_queue: {
        Row: {
          attempts: number | null
          campaign_id: string
          created_at: string
          error_message: string | null
          id: string
          organization_id: string
          scheduled_for: string
          sent_at: string | null
          status: string
          subscriber_id: string
          workflow_trigger_id: string
        }
        Insert: {
          attempts?: number | null
          campaign_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          subscriber_id: string
          workflow_trigger_id: string
        }
        Update: {
          attempts?: number | null
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subscriber_id?: string
          workflow_trigger_id?: string
        }
        Relationships: []
      }
      workflow_triggers: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number | null
          id: string
          is_active: boolean | null
          next_send_at: string | null
          organization_id: string
          started_at: string
          subscriber_id: string
          trigger_data: Json | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          is_active?: boolean | null
          next_send_at?: string | null
          organization_id: string
          started_at?: string
          subscriber_id: string
          trigger_data?: Json | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          is_active?: boolean | null
          next_send_at?: string | null
          organization_id?: string
          started_at?: string
          subscriber_id?: string
          trigger_data?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_triggers_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "email_subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_triggers_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "email_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_product_stock: {
        Args: { _product_id: string; _quantity: number }
        Returns: boolean
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role_in_organization: {
        Args: { _organization_id: string }
        Returns: string
      }
      process_workflow_triggers: {
        Args: {
          _event_data: Json
          _event_type: string
          _organization_id: string
          _user_id: string
        }
        Returns: undefined
      }
      track_customer_event: {
        Args: {
          _event_data?: Json
          _event_type: string
          _organization_id: string
          _session_id: string
          _user_id: string
        }
        Returns: string
      }
      user_has_organization_access: {
        Args: { _organization_id: string }
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
