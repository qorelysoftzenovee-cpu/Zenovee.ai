import { supabaseAdmin } from "@/lib/supabase/admin";

export class CreditService {
  static async getCredits(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("user_credits")
      .select("available_credits")
      .eq("user_id", userId)
      .maybeSingle<{ available_credits: number }>();
    if (error) throw new Error(error.message);
    return data?.available_credits ?? 0;
  }

  static async ensureSufficientCredits(userId: string, required: number) {
    const credits = await this.getCredits(userId);
    if (credits < required) {
      throw new Error("Insufficient credits for this tool execution.");
    }
  }

  static async deductCredits(userId: string, amount: number, description: string) {
    const supabaseRpc = supabaseAdmin as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };

    const { data, error } = await supabaseRpc.rpc("debit_user_credits", {
      p_user_id: userId,
      p_credits: amount,
      p_reference: description,
      p_execution_id: null,
      p_metadata: { source: "credit_service" },
    });

    if (error) throw new Error(error.message.includes("INSUFFICIENT_CREDITS") ? "Insufficient credits for this tool execution." : error.message);

    const row = (Array.isArray(data) ? data[0] : data) as { balance_after?: number } | null;
    return Number(row?.balance_after ?? 0);
  }

  static async addCredits(userId: string, amount: number, description: string) {
    const supabaseRpc = supabaseAdmin as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };

    const { data, error } = await supabaseRpc.rpc("add_topup_credits", {
      p_user_id: userId,
      p_credits: amount,
      p_plan_id: "manual_addition",
      p_reference: description,
      p_metadata: { source: "credit_service" },
    });

    if (error) throw new Error(error.message);

    const row = (Array.isArray(data) ? data[0] : data) as { balance_after?: number } | null;
    return Number(row?.balance_after ?? amount);
  }
}