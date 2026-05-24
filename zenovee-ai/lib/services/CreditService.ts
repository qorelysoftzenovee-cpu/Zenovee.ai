import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getRemainingCredits } from "@/lib/billing/credits";

type SupabaseRpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export class CreditService {
  static async getCredits(userId: string) {
    return getRemainingCredits(userId);
  }

  static async requireCredits(userId: string, required: number) {
    const remaining = await getRemainingCredits(userId);
    if (remaining < required) {
      throw new Error("Insufficient credits for this tool execution.");
    }
    return remaining;
  }

  static async deductCredits(userId: string, amount: number, reference: string) {
    const supabase = getSupabaseAdmin();
    const supabaseRpc = supabase as unknown as SupabaseRpcClient;
    const { data, error } = await supabaseRpc.rpc("debit_user_credits", {
      p_user_id: userId,
      p_credits: amount,
      p_reference: reference,
      p_execution_id: null,
      p_metadata: { source: "credit_service" },
    });

    if (error) {
      throw new Error(error.message.includes("INSUFFICIENT_CREDITS") ? "Insufficient credits for this tool execution." : error.message);
    }

    const row = (Array.isArray(data) ? data[0] : data) as { balance_after?: number } | null;
    return Number(row?.balance_after ?? 0);
  }

  static async refundCredits(userId: string, originalTxId: string, reference: string, executionId: string, reason?: string) {
    const supabase = getSupabaseAdmin();
    const supabaseRpc = supabase as unknown as SupabaseRpcClient;
    const { data, error } = await supabaseRpc.rpc("refund_user_credits", {
      p_user_id: userId,
      p_original_tx: originalTxId,
      p_reference: reference,
      p_execution_id: executionId,
      p_metadata: { reason: reason ?? "Execution failed", source: "credit_service" },
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = (Array.isArray(data) ? data[0] : data) as { balance_after?: number } | null;
    return Number(row?.balance_after ?? 0);
  }

  static async addCredits(userId: string, amount: number, description: string) {
    const supabase = getSupabaseAdmin();
    const supabaseRpc = supabase as unknown as SupabaseRpcClient;
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
