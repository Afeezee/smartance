import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';
import { Logo } from '@/components/Logo';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Logo />
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-text-muted sm:inline">
              {session.user.name} · <span className="capitalize">{session.user.role}</span>
            </span>
            {/*
              Server action: signOut is called on the server, no client bundle
              needed for the button. `redirectTo` sends the user back to /login.
            */}
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
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
