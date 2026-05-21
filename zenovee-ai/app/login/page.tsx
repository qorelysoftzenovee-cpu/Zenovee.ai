"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email");
      const password = formData.get("password");

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: String(email ?? ""),
        password: String(password ?? ""),
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      router.replace("/auth/callback");
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-6 md:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <section className="surface-card content-rhythm p-7 md:p-10">
          <p className="premium-label">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-[2.45rem]">Sign in to your workspace</h1>
          <p className="max-w-xl text-[0.95rem] text-muted-foreground">Access LinkedIn, SEO, outreach, copy, and brand systems from one secure account.</p>
        </section>
        <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <p className="max-w-full break-words whitespace-pre-wrap text-sm font-medium leading-relaxed text-red-500">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">No account? <Link href="/register" className="text-foreground underline-offset-4 hover:underline">Create one</Link></p>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </main>
  );
}
