"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: String(payload.email ?? ""),
        password: String(payload.password ?? ""),
      });

      if (loginError) {
        setError("Your account was created, but automatic sign-in failed. Please login manually.");
        router.push("/login");
        return;
      }

      router.replace("/auth/callback");
      router.refresh();
    } catch {
      setError("Unable to create your account right now. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-6 md:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <section className="surface-card content-rhythm p-7 md:p-10">
          <p className="premium-label">Create account</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-[2.45rem]">Start your AI workspace</h1>
          <p className="max-w-xl text-[0.95rem] text-muted-foreground">Set up your account to operate every growth system from one premium workspace.</p>
        </section>
        <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error ? (
                <p className="max-w-full break-words whitespace-pre-wrap text-sm font-medium leading-relaxed text-red-500">
                  {error}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" autoComplete="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
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
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="text-foreground underline-offset-4 hover:underline">Sign in</Link></p>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </main>
  );
}
