import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function Badge({ className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-sidebar-active px-2 py-0.5 text-xs font-medium text-muted ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
