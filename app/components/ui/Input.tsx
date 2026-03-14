import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const inputClass =
  "h-10 w-full rounded-xl border border-input-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-focus-ring focus:outline-none focus:ring-2 focus:ring-focus-ring/20";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`${inputClass} ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";
