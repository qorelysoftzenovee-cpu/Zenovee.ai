import { supabaseAdmin } from "@/lib/supabase/admin";

export class CreditService {
  static async getCredits(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
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
    const { error: creditError } = await supabaseAdmin
      .from("credits")
      .upsert({ user_id: userId, balance: nextBalance }, { onConflict: "user_id" });
    if (creditError) throw new Error(creditError.message);

    const { error: usageError } = await supabaseAdmin.from("tool_usage").insert({
      user_id: userId,
      tool_id: "credit_event",
      tool_name: description,
      input: { type: "USAGE", amount },
      output: { remaining: nextBalance },
      cost: amount,
      api_cost: 0,
    });
    if (usageError) throw new Error(usageError.message);

    return nextBalance;
  }

  static async addCredits(userId: string, amount: number, description: string) {
    const currentCredits = await this.getCredits(userId);
    const nextBalance = currentCredits + amount;
    const { error } = await supabaseAdmin
      .from("credits")
      .upsert({ user_id: userId, balance: nextBalance }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("payments").insert({
      user_id: userId,
      amount,
      status: "CREDIT_TOPUP",
      currency: "INR",
      order_id: description,
    });
  }
}