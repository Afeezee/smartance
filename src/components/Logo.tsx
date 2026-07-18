import Image from 'next/image';
import Link from 'next/link';

/**
 * The Smartance wordmark + OUI shield. Wrapped in a link by default so it
 * doubles as a "go home" affordance from anywhere in the app.
 */
export function Logo({
  size = 40,
  href = '/',
}: {
  size?: number;
  /** Set to null to render as plain text (e.g. inside the landing hero itself). */
  href?: string | null;
}) {
  const inner = (
    <div className="flex items-center gap-3">
      <Image
        src="/oui-logo.png"
        alt="Oduduwa University Ipetumodu"
        width={size}
        height={size}
        priority
      />
      <span className="text-lg font-semibold tracking-tight">Smartance</span>
    </div>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-block rounded-md transition hover:opacity-80">
      {inner}
    </Link>
  );
}
