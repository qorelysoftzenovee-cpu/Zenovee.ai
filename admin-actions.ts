"use server"

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CreditService } from "@/credit-service";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath, revalidateTag } from "next/cache";

export async function adminUpdateCredits(userId: string, newTotal: number) {
  const supabase = createServerActionClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  // Admin check via profile role
  const { data: adminProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', session?.user.id).single();
  if (adminProfile?.role !== 'admin') throw new Error("Unauthorized");

  const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
  const diff = newTotal - (profile?.credits || 0);

  await supabaseAdmin.from('profiles').update({ credits: newTotal }).eq('id', userId);

  if (diff !== 0) {
    await CreditService.logCreditTransaction(userId, diff, 'BONUS', 'Admin credit update');
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminUpdateSubscriptionStatus(subscriptionId: string, status: "ACTIVE" | "CANCELLED" | "EXPIRED") {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status },
  });

  revalidatePath("/admin/subscriptions"); // Assuming an admin subscriptions page
  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function getBusinessMetrics() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const [totalUsers, activeSubs, usageStats, revenueData, newUsersToday] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.toolUsage.aggregate({
      _sum: { apiCost: true, creditsUsed: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
    }),
    prisma.user.count({ 
      where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } 
    })
  ]);

  // Financial logic
  const totalRevenue = revenueData._sum.amount || 0;
  const totalApiCost = usageStats._sum.apiCost || 0;
  const netProfit = totalRevenue - totalApiCost;

  return {
    totalRevenue,
    totalApiCost,
    netProfit,
    totalUsers,
    newUsersToday,
    activeSubscriptions: activeSubs,
    totalRequests: usageStats._count,
    totalCreditsUsed: usageStats._sum.creditsUsed || 0,
    failedRequests: 0, // Should be calculated from a status column if added to schema
    profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  };
}

export async function addBonusCredits(userId: string, amount: number, reason: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
    prisma.creditLog.create({
      data: {
        userId,
        amount,
        type: "BONUS",
        description: reason,
      }
    }),
  ]);

  return { success: true };
}

export async function getUsageAnalytics() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  return await prisma.toolUsage.findMany({
    take: 100,
    orderBy: { timestamp: "desc" },
    include: { user: { select: { name: true, email: true } } }
  });
}

export async function getLiveActivity() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  return await prisma.toolUsage.findMany({
    take: 15,
    orderBy: { timestamp: "desc" },
    include: { user: { select: { name: true } } }
  });
}