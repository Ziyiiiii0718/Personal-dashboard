import * as React from "react";

export interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  /** Optional; default is loading message */
  loading?: boolean;
}

export function PageLayout({
  title,
  children,
  loading = false,
}: PageLayoutProps) {
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {title}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        {title}
      </h1>
      <div className="space-y-8">{children}</div>
    </div>
  );
}
