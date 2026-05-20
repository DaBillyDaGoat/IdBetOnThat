import * as React from "react";
import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, hint, error, id, className, ...rest }, ref) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 px-3 rounded-xl border bg-white text-ink placeholder:text-ink-muted",
            "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
            error ? "border-warn" : "border-ink/15",
            className,
          )}
          {...rest}
        />
        {error ? (
          <p className="text-xs text-warn">{error}</p>
        ) : hint ? (
          <p className="text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);
