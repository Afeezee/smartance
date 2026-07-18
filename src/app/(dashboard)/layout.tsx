import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { Logo } from '@/components/Logo';
import type { Role } from '@/lib/db/schema';

const navByRole: Record<Role, { href: string; label: string }[]> = {
  admin: [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/lecturers', label: 'Lecturers' },
    { href: '/admin/courses', label: 'Courses' },
  ],
  lecturer: [{ href: '/lecturer', label: 'My courses' }],
  student: [{ href: '/student', label: 'My courses' }],
};

const roleHome: Record<Role, string> = {
  admin: '/admin',
  lecturer: '/lecturer',
  student: '/student',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const nav = navByRole[session.user.role];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-6">
            <Logo href={roleHome[session.user.role]} />
            <nav className="hidden items-center gap-4 text-sm md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-text-muted transition hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="hidden text-text-muted transition hover:text-primary sm:inline"
            >
              Home
            </Link>
            <span className="hidden text-text-muted lg:inline">
              {session.user.name} · <span className="capitalize">{session.user.role}</span>
            </span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-border/40"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Mobile nav row — the desktop nav lives above, hidden below md */}
        {nav.length > 1 && (
          <div className="border-t border-border bg-surface md:hidden">
            <nav className="mx-auto flex max-w-5xl gap-4 overflow-x-auto px-6 py-2 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap text-text-muted transition hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
