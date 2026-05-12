"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (!error) {
      router.push("/login");
      router.refresh();
    }

    setIsSubmitting(false);
  };

  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={handleLogout} disabled={isSubmitting}>
      {isSubmitting ? "Logging out..." : "Logout"}
    </Button>
  );
}
