"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LiveSync({ userId, admin = false }: { userId: string; admin?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`live-sync:${userId}:${admin ? "admin" : "user"}`);

    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "tool_usage", filter: `user_id=eq.${userId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${userId}` }, () => router.refresh());

    if (admin) {
      channel
        .on("postgres_changes", { event: "*", schema: "public", table: "api_usage" }, () => router.refresh())
        .on("postgres_changes", { event: "*", schema: "public", table: "admin_logs" }, () => router.refresh());
    }

    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [admin, router, userId]);

  return null;
}
