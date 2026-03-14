import * as React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const textareaClass =
  "min-h-[80px] w-full rounded-xl border border-input-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-focus-ring focus:outline-none focus:ring-2 focus:ring-focus-ring/20";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${textareaClass} ${className}`}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
