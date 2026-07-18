import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        'rounded-lg border border-border bg-surface p-5 shadow-sm ' + className
      }
      {...rest}
    />
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      {hint && <p className="mt-1 text-sm text-text-muted">{hint}</p>}
    </div>
  );
}
