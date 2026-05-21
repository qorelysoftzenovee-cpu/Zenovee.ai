import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 text-sm shadow-[0_8px_18px_-18px_rgba(15,23,42,0.35)] outline-none transition-all duration-200 ease-out placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
