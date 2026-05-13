export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: "USER" | "ADMIN";
          status: "ACTIVE" | "SUSPENDED" | "BANNED";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: "USER" | "ADMIN";
          status?: "ACTIVE" | "SUSPENDED" | "BANNED";
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          current_period_end: string | null;
          razorpay_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plan_id: string;
          status: string;
          current_period_end?: string | null;
          razorpay_subscription_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      credits: {
        Row: {
          user_id: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
        };
        Update: { balance?: number };
        Relationships: [];
      };
      tool_usage: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          tool_name: string;
          input: Json;
          output: Json;
          cost: number;
          api_cost: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          tool_id: string;
          tool_name: string;
          input: Json;
          output: Json;
          cost: number;
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
          storage_path: string | null;
          file_type: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          tool_usage_id?: string | null;
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
          amount: number;
          currency: string;
          status: string;
          order_id: string | null;
          razorpay_payment_id: string | null;
          subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          currency?: string;
          status: string;
          order_id?: string | null;
          razorpay_payment_id?: string | null;
          subscription_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      admin_logs: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          admin_user_id: string;
          action: string;
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
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          provider: string;
          model: string;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
        Update: Partial<Database["public"]["Tables"]["api_usage"]["Insert"]>;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
