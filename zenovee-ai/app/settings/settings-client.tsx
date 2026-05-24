"use client";

import { useTheme } from "next-themes";

export function SettingsClient() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
    >
      Switch to {isDark ? "Light" : "Dark"} Theme
    </button>
  );
}
