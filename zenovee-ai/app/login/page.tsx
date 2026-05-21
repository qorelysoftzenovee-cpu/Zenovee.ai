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
    <main className="min-h-screen bg-slate-100 px-4 py-10 md:px-6 md:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <section className="rounded-3xl border border-slate-800/80 bg-slate-950 p-7 text-slate-100 md:p-10">
          <p className="premium-label border-white/20 bg-white/10 text-slate-200">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-[2.45rem]">Sign in to your workspace</h1>
          <p className="max-w-xl text-[0.95rem] text-slate-300">Access LinkedIn, SEO, outreach, copy, and brand systems from one secure account.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-300">Workspace access</p>
              <p className="mt-2 text-sm text-slate-100">Resume your active workflow in one click.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-300">Secure sign in</p>
              <p className="mt-2 text-sm text-slate-100">Protected account authentication and session handling.</p>
            </div>
          </div>
        </section>
        <div className="mx-auto w-full max-w-md">
        <Card className="border-border/80 bg-card shadow-[0_20px_44px_-28px_rgba(15,23,42,0.35)]">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your account details to continue.</p>
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
