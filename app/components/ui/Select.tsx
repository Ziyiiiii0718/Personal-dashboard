import * as React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const selectClass =
  "h-10 rounded-xl border border-input-border bg-surface px-3 py-2 text-sm text-foreground focus:border-focus-ring focus:outline-none focus:ring-2 focus:ring-focus-ring/20";

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...props }, ref) => (
    <select
      ref={ref}
      className={`${selectClass} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
