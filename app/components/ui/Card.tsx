import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional header slot (title + actions) */
  header?: React.ReactNode;
}

export function Card({ header, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 ${className}`}
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
