export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: "user" | "admin";
          status: "ACTIVE" | "SUSPENDED" | "BANNED";
          plan: string;
          credits_balance: number;
          avatar_url: string | null;
          signup_date: string;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: "user" | "admin";
          status?: "ACTIVE" | "SUSPENDED" | "BANNED";
          plan?: string;
          credits_balance?: number;
          avatar_url?: string | null;
          signup_date?: string;
          last_login_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_name: string;
          plan_id: string;
          status: "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
          renewal_date: string | null;
          billing_cycle: "weekly" | "monthly" | "quarterly" | "yearly";
          razorpay_subscription_id: string | null;
          current_period_end: string | null;
          next_renewal_at: string | null;
          last_payment_at: string | null;
          grace_until: string | null;
          cancel_at_period_end: boolean;
          pending_plan_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plan_name: string;
          status: "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
          renewal_date?: string | null;
          billing_cycle?: "weekly" | "monthly" | "quarterly" | "yearly";
          razorpay_subscription_id?: string | null;
          current_period_end?: string | null;
          next_renewal_at?: string | null;
          last_payment_at?: string | null;
          grace_until?: string | null;
          cancel_at_period_end?: boolean;
          pending_plan_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      credits: {
        Row: {
          id: string;
          user_id: string;
          credits_added: number;
          credits_consumed: number;
          remaining_balance: number;
          balance: number;
          reset_date: string | null;
          reset_interval: "weekly" | "monthly" | "quarterly" | "yearly" | "none" | null;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          credits_added?: number;
          credits_consumed?: number;
          remaining_balance?: number;
          reset_date?: string | null;
          reset_interval?: "weekly" | "monthly" | "quarterly" | "yearly" | "none" | null;
          reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["credits"]["Insert"]>;
        Relationships: [];
      };
      tool_usage: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          tool_name: string;
          credits_consumed: number;
          cost: number;
          ai_model: string | null;
          provider: string | null;
          generation_duration_ms: number | null;
          input: Json;
          output: Json;
          api_cost: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          tool_id: string;
          tool_name: string;
          credits_consumed?: number;
          ai_model?: string | null;
          provider?: string | null;
          generation_duration_ms?: number | null;
          input: Json;
          output: Json;
          api_cost?: number;
        };
        Update: Partial<Database["public"]["Tables"]["tool_usage"]["Insert"]>;
        Relationships: [];
      };
      generation_history: {
        Row: {
          id: string;
          user_id: string;
          tool_usage_id: string | null;
          tool_id: string | null;
          prompt: string | null;
          output: string | null;
          exports: Json | null;
          storage_path: string | null;
          file_type: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          tool_usage_id?: string | null;
          tool_id?: string | null;
          prompt?: string | null;
          output?: string | null;
          exports?: Json | null;
          storage_path?: string | null;
          file_type?: string | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["generation_history"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          payment_amount: number;
          amount: number;
          plan: string;
          status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "CREDIT_TOPUP";
          currency: string;
          invoice_id: string | null;
          razorpay_transaction_id: string | null;
          razorpay_payment_id: string | null;
          order_id: string | null;
          subscription_id: string | null;
          failure_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          payment_amount: number;
          amount: number;
          plan: string;
          status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "CREDIT_TOPUP";
          currency?: string;
          invoice_id?: string | null;
          razorpay_transaction_id?: string | null;
          order_id?: string | null;
          subscription_id?: string | null;
          failure_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      admin_logs: {
        Row: {
          id: string;
          admin_user_id: string;
          target_user_id: string | null;
          action: string;
          credit_change: number | null;
          ban_state: string | null;
          manual_adjustment: Json | null;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          admin_user_id: string;
          target_user_id?: string | null;
          action: string;
          credit_change?: number | null;
          ban_state?: string | null;
          manual_adjustment?: Json | null;
          payload?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["admin_logs"]["Insert"]>;
        Relationships: [];
      };
      api_usage: {
        Row: {
          id: string;
          user_id: string | null;
          provider: string;
          model: string;
          token_usage: number;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          cost: number;
          failure_count: number;
          status: "success" | "failed";
          latency_ms: number | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          provider: string;
          model: string;
          token_usage?: number;
          prompt_tokens?: number;
          completion_tokens?: number;
          cost?: number;
          failure_count?: number;
          status?: "success" | "failed";
          latency_ms?: number | null;
          request_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["api_usage"]["Insert"]>;
        Relationships: [];
      };
      support_requests: {
        Row: {
          id: string;
          user_id: string;
          issue: string;
          status: "open" | "in_progress" | "resolved" | "closed";
          priority: "low" | "normal" | "high" | "urgent";
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          issue: string;
          status?: "open" | "in_progress" | "resolved" | "closed";
          priority?: "low" | "normal" | "high" | "urgent";
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["support_requests"]["Insert"]>;
        Relationships: [];
      };
      abuse_flags: {
        Row: {
          id: string;
          user_id: string | null;
          ip_address: string | null;
          category: string;
          score: number;
          details: Json | null;
          reviewed: boolean;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          ip_address?: string | null;
          category: string;
          score: number;
          details?: Json | null;
          reviewed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["abuse_flags"]["Insert"]>;
        Relationships: [];
      };
      billing_plans: {
        Row: {
          app_plan_id: string;
          razorpay_plan_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          app_plan_id: string;
          razorpay_plan_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing_plans"]["Insert"]>;
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: string;
          event_id: string;
          event_type: string;
          user_id: string | null;
          subscription_id: string | null;
          payment_id: string | null;
          payload: Json | null;
          processed_at: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          event_type: string;
          user_id?: string | null;
          subscription_id?: string | null;
          payment_id?: string | null;
          payload?: Json | null;
          processed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing_events"]["Insert"]>;
        Relationships: [];
      };
      ai_request_logs: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          ip_address: string;
          usage_class: "standard" | "heavy";
          plan_id: string;
          status: string;
          prompt_chars: number;
          failure_reason: string | null;
          abuse_score: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          tool_id: string;
          ip_address: string;
          usage_class: "standard" | "heavy";
          plan_id: string;
          status: string;
          prompt_chars: number;
          failure_reason?: string | null;
          abuse_score?: number;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["ai_request_logs"]["Insert"]>;
        Relationships: [];
      };
      ai_abuse_flags: {
        Row: {
          id: string;
          user_id: string;
          ip_address: string;
          flag_type: string;
          score: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          ip_address: string;
          flag_type: string;
          score: number;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["ai_abuse_flags"]["Insert"]>;
        Relationships: [];
      };
      ai_cooldowns: {
        Row: {
          scope_key: string;
          reason: string;
          cooldown_until: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          scope_key: string;
          reason: string;
          cooldown_until: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_cooldowns"]["Insert"]>;
        Relationships: [];
      };
      seo_analytics_events: {
        Row: {
          id: string;
          event_type: "pageview" | "conversion" | "ranking" | "traffic";
          page_path: string;
          referrer: string | null;
          event_label: string | null;
          ip_address: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          event_type: "pageview" | "conversion" | "ranking" | "traffic";
          page_path: string;
          referrer?: string | null;
          event_label?: string | null;
          ip_address?: string | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["seo_analytics_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
