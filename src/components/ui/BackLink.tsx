import Link from 'next/link';

/**
 * Consistent back-affordance used at the top of nested pages. Keep the
 * label short — the arrow does most of the work.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-text-muted transition hover:text-primary"
    >
      <span aria-hidden>←</span>
      <span>{label}</span>
    </Link>
  );
}
