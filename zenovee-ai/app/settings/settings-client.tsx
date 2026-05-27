"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Moon, Monitor, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const themeOptions = [
  { value: "light", label: "Light", description: "Bright workspace surfaces for daytime focus.", icon: Sun },
  { value: "dark", label: "Dark", description: "Low-glare viewing for long execution sessions.", icon: Moon },
  { value: "system", label: "System", description: "Follow your device preference automatically.", icon: Monitor },
] as const;

export function SettingsClient({ email }: { email: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetTone, setResetTone] = useState<"default" | "success" | "error">("default");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordTone, setPasswordTone] = useState<"default" | "success" | "error">("default");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme ?? "system" : "system";
  const themeStatus = mounted ? resolvedTheme ?? "light" : "light";

  const passwordValidationMessage = useMemo(() => {
    if (!password && !confirmPassword) return null;
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (confirmPassword && password !== confirmPassword) return "Passwords do not match.";
    return null;
  }, [confirmPassword, password]);

  const handlePasswordUpdate = async () => {
    if (isUpdatingPassword) return;
    if (passwordValidationMessage) {
      setPasswordTone("error");
      setPasswordMessage(passwordValidationMessage);
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage(null);
    setPasswordTone("default");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPasswordTone("error");
        setPasswordMessage(error.message || "Unable to update password right now.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setPasswordTone("success");
      setPasswordMessage("Password updated successfully. Your account security settings are now saved.");
    } catch {
      setPasswordTone("error");
      setPasswordMessage("Unable to update password right now. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleResetEmail = async () => {
    if (isSendingReset) return;

    setIsSendingReset(true);
    setResetMessage(null);
    setResetTone("default");

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: origin ? `${origin}/settings?mode=recovery` : undefined,
      });

      if (error) {
        setResetTone("error");
        setResetMessage(error.message || "Unable to send password reset email right now.");
        return;
      }

      setResetTone("success");
      setResetMessage("Password reset email sent. Open the secure link in your inbox to continue.");
    } catch {
      setResetTone("error");
      setResetMessage("Unable to send password reset email right now. Please try again.");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_-38px_rgba(15,23,42,0.16)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-950">Theme preference</p>
          <p className="text-sm leading-6 text-slate-600">
            Persist your interface preference across sessions with a stable, app-like presentation.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const active = activeTheme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`flex items-start justify-between gap-4 rounded-[22px] border px-4 py-4 text-left transition ${
                  active
                    ? "border-slate-900 bg-slate-950 text-white shadow-[0_18px_36px_-26px_rgba(15,23,42,0.45)]"
                    : "border-slate-200 bg-slate-50/80 text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-2xl p-2.5 ${active ? "bg-white/10 text-white" : "bg-white text-slate-700"}`}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className={`mt-1 text-sm leading-6 ${active ? "text-slate-300" : "text-slate-600"}`}>{option.description}</p>
                  </div>
                </div>
                {active ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
          Current applied appearance: <span className="font-semibold text-slate-900 capitalize">{themeStatus}</span>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_-38px_rgba(15,23,42,0.16)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-950">Password & security</p>
          <p className="text-sm leading-6 text-slate-600">
            Update the password for <span className="font-medium text-slate-900">{email}</span> directly through your authenticated session.
          </p>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your new password"
              autoComplete="new-password"
            />
          </div>
        </div>

        {passwordValidationMessage ? <p className="mt-3 text-sm text-rose-600">{passwordValidationMessage}</p> : null}
        {passwordMessage ? (
          <p
            className={`mt-3 text-sm ${
              passwordTone === "error"
                ? "text-rose-600"
                : passwordTone === "success"
                ? "text-emerald-600"
                : "text-slate-600"
            }`}
          >
            {passwordMessage}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => void handlePasswordUpdate()} disabled={Boolean(passwordValidationMessage) || !password || isUpdatingPassword}>
            {isUpdatingPassword ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating password...
              </>
            ) : (
              "Update password"
            )}
          </Button>
          <Button variant="outline" onClick={() => void handleResetEmail()} disabled={isSendingReset}>
            {isSendingReset ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send reset email"
            )}
          </Button>
        </div>

        {resetMessage ? (
          <p
            className={`mt-3 text-sm ${
              resetTone === "error"
                ? "text-rose-600"
                : resetTone === "success"
                ? "text-emerald-600"
                : "text-slate-600"
            }`}
          >
            {resetMessage}
          </p>
        ) : null}
      </section>
    </div>
  );
}
