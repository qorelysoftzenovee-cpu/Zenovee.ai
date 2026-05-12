import { supabaseAdmin } from "@/lib/supabase";

export class CreditService {
  static async checkCredits(userId: string, required: number): Promise<boolean> {
    const { data } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
    return (data?.credits ?? 0) >= required;
  }

  static async deductCredits(userId: string, amount: number): Promise<void> {
    const { data } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
    await supabaseAdmin.from('profiles').update({ 
      credits: (data?.credits || 0) - amount 
    }).eq('id', userId);
  }

  static async logCreditTransaction(userId: string, amount: number, type: string, description: string): Promise<void> {
    await supabaseAdmin.from('credit_logs').insert({
      user_id: userId,
      amount,
      type,
      description
    });
  }
}