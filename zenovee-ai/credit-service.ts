import { supabaseAdmin } from "@/lib/supabase/admin";

export class CreditService {
  static async getCredits(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ balance: number }>();
    if (error) throw new Error(error.message);
    return data?.balance ?? 0;
  }

  static async ensureSufficientCredits(userId: string, required: number) {
    const credits = await this.getCredits(userId);
    if (credits < required) {
      throw new Error("Insufficient credits for this tool execution.");
    }
  }

  static async deductCredits(userId: string, amount: number, description: string) {
    const currentCredits = await this.getCredits(userId);
    if (currentCredits < amount) {
      throw new Error("Insufficient credits for this tool execution.");
    }

    const nextBalance = currentCredits - amount;
    const nowIso = new Date().toISOString();

    const { error: creditError } = await supabaseAdmin.from("credits").insert({
      user_id: userId,
      credits_added: 0,
      credits_consumed: amount,
      remaining_balance: nextBalance,
      reason: description,
      reset_interval: "monthly",
      updated_at: nowIso,
    } as never);
    if (creditError) throw new Error(creditError.message);

    await supabaseAdmin
      .from("users")
      .update({ credits_balance: nextBalance, updated_at: nowIso } as never)
      .eq("id", userId);

    const { error: usageError } = await supabaseAdmin.from("tool_usage").insert({
      user_id: userId,
      tool_id: "credit_event",
      tool_name: description,
      input: { type: "USAGE", amount },
      output: { remaining: nextBalance },
      credits_consumed: amount,
      api_cost: 0,
    });
    if (usageError) throw new Error(usageError.message);

    return nextBalance;
  }

  static async addCredits(userId: string, amount: number, description: string) {
    const currentCredits = await this.getCredits(userId);
    const nextBalance = currentCredits + amount;
    const nowIso = new Date().toISOString();
    const { error } = await supabaseAdmin.from("credits").insert({
      user_id: userId,
      credits_added: amount,
      credits_consumed: 0,
      remaining_balance: nextBalance,
      reason: description,
      reset_interval: "monthly",
      updated_at: nowIso,
    } as never);
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("users")
      .update({ credits_balance: nextBalance, updated_at: nowIso } as never)
      .eq("id", userId);

    await supabaseAdmin.from("payments").insert({
      user_id: userId,
      payment_amount: amount,
      plan: "credit_topup",
      status: "CREDIT_TOPUP",
      currency: "INR",
      order_id: description,
    });
  }
}