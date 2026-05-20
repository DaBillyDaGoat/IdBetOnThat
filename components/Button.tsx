import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-dark active:bg-accent-dark disabled:bg-ink-muted",
  secondary:
    "bg-white text-ink border border-ink/15 hover:bg-paper-soft disabled:text-ink-muted",
  ghost: "bg-transparent text-ink hover:bg-paper-soft",
  danger: "bg-warn text-white hover:bg-red-700",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

const baseStyles =
  "inline-flex items-center justify-center font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-60 select-none";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
};

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  target,
  rel,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
    >
      {children}
    </Link>
  );
}
