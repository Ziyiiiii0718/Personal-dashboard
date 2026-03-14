import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional header slot (title + actions) */
  header?: React.ReactNode;
}

export function Card({ header, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface-card p-5 shadow-[var(--shadow-soft)] backdrop-blur-sm ${className}`}
      {...props}
    >
      {header != null && (
        <div className="mb-3 flex items-center justify-between">
          {header}
        </div>
      )}
      {children}
    </div>
  );
}
