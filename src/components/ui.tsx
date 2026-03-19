"use client";

import * as React from "react";

import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border font-medium transition outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      intent: {
        primary:
          "border-transparent bg-accent text-accent-foreground shadow-[0_14px_30px_rgba(196,107,46,0.28)] hover:bg-accent-strong focus-visible:ring-[var(--ring)]",
        subtle:
          "border-border bg-white/70 text-foreground hover:border-border-strong hover:bg-white focus-visible:ring-[var(--ring)]",
        ghost:
          "border-transparent bg-transparent text-foreground-soft hover:bg-white/55 hover:text-foreground focus-visible:ring-[var(--ring)]",
        danger:
          "border-transparent bg-danger text-white shadow-[0_14px_30px_rgba(181,67,52,0.22)] hover:opacity-92 focus-visible:ring-[rgba(181,67,52,0.28)]",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ asChild = false, className, intent, size, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ intent, size }), className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-border bg-white/72 px-4 text-sm text-foreground outline-none transition placeholder:text-foreground-soft/70 focus:border-border-strong focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[220px] w-full rounded-[1.6rem] border border-border bg-white/72 px-4 py-4 text-sm leading-7 text-foreground outline-none transition placeholder:text-foreground-soft/70 focus:border-border-strong focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root className={cn("text-sm font-medium text-foreground", className)} {...props} />
  );
}

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "accent" | "teal" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        tone === "default" && "border-border bg-white/65 text-foreground-soft",
        tone === "accent" && "border-transparent bg-accent/14 text-accent-strong",
        tone === "teal" && "border-transparent bg-teal/12 text-teal",
        className,
      )}
      {...props}
    />
  );
}
