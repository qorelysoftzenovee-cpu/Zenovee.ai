import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-3xl border border-border/75 bg-card text-card-foreground shadow-[0_18px_44px_-30px_rgba(15,23,42,0.28)] backdrop-blur-sm transition-all duration-200 interactive-lift",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-2 p-6 md:p-7", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg font-semibold tracking-tight leading-tight text-inherit md:text-xl", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-6 pt-0 md:p-7 md:pt-0", className)} {...props} />;
}

// Premium card variant with enhanced elevation
function PremiumCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="premium-card"
      className={cn(
        "rounded-3xl border border-border/60 bg-gradient-to-br from-card to-card/95 text-card-foreground shadow-[0_24px_48px_-30px_rgba(15,23,42,0.35)] backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_32px_56px_-24px_rgba(15,23,42,0.45)]",
        className
      )}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle, PremiumCard };
