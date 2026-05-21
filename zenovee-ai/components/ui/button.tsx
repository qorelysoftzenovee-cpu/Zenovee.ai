import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,hsl(var(--primary))_0%,color-mix(in_oklab,hsl(var(--primary))_72%,hsl(var(--accent))_28%)_100%)] text-primary-foreground shadow-[0_14px_28px_-16px_rgba(79,70,229,0.75)] hover:-translate-y-0.5 hover:brightness-[1.03] hover:shadow-[0_18px_36px_-12px_rgba(79,70,229,0.85)]",
        secondary:
          "border border-border/80 bg-secondary/80 text-secondary-foreground shadow-[0_8px_20px_-18px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:bg-secondary hover:shadow-[0_12px_28px_-16px_rgba(15,23,42,0.55)] hover:border-border/60",
        ghost: "hover:bg-muted/80 hover:text-foreground transition-colors duration-200",
        outline: "border border-border/80 bg-background/85 shadow-[0_8px_18px_-18px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 hover:bg-muted/70 hover:shadow-[0_12px_28px_-16px_rgba(15,23,42,0.4)] hover:border-border/60",
        destructive:
          "border border-danger/20 bg-danger text-danger-foreground shadow-[0_12px_24px_-18px_rgba(220,38,38,0.7)] hover:-translate-y-0.5 hover:bg-danger/90 hover:shadow-[0_16px_32px_-16px_rgba(220,38,38,0.85)] hover:border-danger/30",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      className: cn(buttonVariants({ variant, size, className }), children.props.className),
      ...props,
    });
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </button>
  );
}

export { Button, buttonVariants };
