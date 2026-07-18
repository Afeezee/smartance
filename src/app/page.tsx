import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/Logo';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();
  const roleHome =
    session?.user?.role &&
    ({ admin: '/admin', lecturer: '/lecturer', student: '/student' } as const)[
      session.user.role
    ];

  return (
    <div className="min-h-screen">
      {/* -------------------------------------------------- Top nav */}
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Logo size={40} href={null} />
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#how-it-works" className="text-text-muted hover:text-primary">
              How it works
            </a>
            <a href="#for-lecturers" className="text-text-muted hover:text-primary">
              For lecturers
            </a>
            <a href="#for-students" className="text-text-muted hover:text-primary">
              For students
            </a>
            <a href="#faq" className="text-text-muted hover:text-primary">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {roleHome ? (
              <Link
                href={roleHome}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-text-muted hover:text-primary sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* -------------------------------------------------- Hero */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center rounded-full bg-secondary/40 px-3 py-1 text-xs font-medium text-text">
              For Oduduwa University Ipetumodu
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Take attendance in seconds,{' '}
              <span className="text-primary">no paper needed</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-text-muted">
              Smartance turns your phone into your attendance sheet. Your lecturer puts a
              code on screen, you scan it with your camera, and you&apos;re marked
              present. That&apos;s it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {roleHome ? (
                <Link
                  href={roleHome}
                  className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-base font-medium text-white hover:bg-primary-hover"
                >
                  Open my dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-base font-medium text-white hover:bg-primary-hover"
                  >
                    I&apos;m a student — sign me up
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-6 text-base font-medium hover:bg-border/40"
                  >
                    I already have an account
                  </Link>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-text-muted">
              Free for OUI. No app to download. Works on any phone with a camera.
            </p>
          </div>

          {/* Right-hand illustration: layered card with a mock QR + rotating hint */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>CSC 401 · Live</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Rotating
                </span>
              </div>
              <div className="mt-4 aspect-square rounded-lg border border-border bg-white p-3">
                {/* Purely decorative — a "QR-like" grid so the hero has a visual */}
                <div className="grid h-full w-full grid-cols-9 grid-rows-9 gap-[3px]">
                  {Array.from({ length: 81 }).map((_, i) => (
                    <div
                      key={i}
                      className={
                        // Deterministic pseudo-random pattern so it looks QR-ish
                        [4, 7, 9, 12, 15, 18, 22, 24, 25, 29, 31, 34, 36, 38, 41,
                         44, 47, 49, 52, 55, 57, 59, 62, 66, 68, 70, 73, 75, 78].includes(i)
                          ? 'bg-text'
                          : 'bg-transparent'
                      }
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-text-muted">
                A new code appears every few seconds — screenshots don&apos;t work.
              </p>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-surface px-4 py-3 shadow-md sm:block">
              <p className="text-xs text-text-muted">Kemi just marked present</p>
              <p className="text-sm font-medium">✓ H/24/CS/0011</p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- Trust bar */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:grid-cols-3">
          <Stat number="< 5 sec" label="from scan to marked present" />
          <Stat number="0 apps" label="to install — uses your phone camera" />
          <Stat number="1 tap" label="from your lecturer to start a session" />
        </div>
      </section>

      {/* -------------------------------------------------- How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">How Smartance works</h2>
          <p className="mt-3 text-text-muted">
            Three simple steps. Nothing to learn, nothing to install.
          </p>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          <Step
            number={1}
            title="Your lecturer starts class"
            body="They tap ‘Start session’ on their laptop. A QR code appears on the projector. It refreshes every few seconds, so nobody can share a screenshot."
          />
          <Step
            number={2}
            title="You scan the code"
            body="Open your phone camera and point it at the screen. The scan takes you to a page where you sign in once — after that, marking is a single tap."
          />
          <Step
            number={3}
            title="You&apos;re marked present"
            body="Your name shows up on your lecturer&apos;s live list. You can close your phone and go back to the lesson."
          />
        </ol>
      </section>

      {/* -------------------------------------------------- For lecturers / students */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
          <div id="for-lecturers">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              For lecturers
            </p>
            <h3 className="mt-2 text-2xl font-bold">Stop passing sheets around</h3>
            <p className="mt-3 text-text-muted">
              Class starts, you tap once, and Smartance handles the rest. Everyone shows
              up in a live list on your screen as they check in.
            </p>
            <ul className="mt-6 space-y-3">
              <Bullet>See who&apos;s in the room, in real time.</Bullet>
              <Bullet>Download the full record as a spreadsheet whenever you want.</Bullet>
              <Bullet>
                Get a plain-English weekly summary of who&apos;s attending and who might
                need a check-in.
              </Bullet>
              <Bullet>Optional classroom-only mode using GPS, if you want it.</Bullet>
            </ul>
          </div>
          <div id="for-students">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              For students
            </p>
            <h3 className="mt-2 text-2xl font-bold">Show up, scan, sit down</h3>
            <p className="mt-3 text-text-muted">
              You&apos;ve got enough on your plate. Smartance takes the paperwork out of
              proving you were in class.
            </p>
            <ul className="mt-6 space-y-3">
              <Bullet>Sign up once with your matric number and email.</Bullet>
              <Bullet>Enroll in your courses — search, tap, done.</Bullet>
              <Bullet>Scan the QR at the start of class. That&apos;s the whole flow.</Bullet>
              <Bullet>See your attendance history anytime on your dashboard.</Bullet>
            </ul>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- Why it's fair */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12">
          <h3 className="text-2xl font-bold sm:text-3xl">
            Fair to the students who actually show up
          </h3>
          <p className="mt-3 max-w-3xl text-text-muted">
            The old paper roll can be signed by anyone. Static QR codes can be shared in a
            group chat. Smartance is different — the code on your lecturer&apos;s screen
            changes every few seconds, and one phone can only mark one student per day.
            Nobody signs in for their absent friends.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------- FAQ */}
      <section id="faq" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h3 className="text-3xl font-bold">Questions students ask</h3>
          <dl className="mt-8 space-y-6">
            <Faq q="Do I need to install anything?">
              No. You just open your phone camera, point it at the QR code, and tap the
              link that pops up. Smartance opens in your browser.
            </Faq>
            <Faq q="What if my internet is slow?">
              You&apos;ll just wait a couple of seconds longer while the page loads. The
              check-in itself is a tiny request — it works on very weak connections.
            </Faq>
            <Faq q="Can I ask a friend to mark me?">
              Not really. Each phone can only mark one student, and the code on the
              screen changes every few seconds — screenshots go stale before they arrive.
              If someone tries, your lecturer sees a flag on the record.
            </Faq>
            <Faq q="Where do I get my account?">
              If you&apos;re a student, tap “Get started” at the top of this page and
              register with your matric number. If you&apos;re a lecturer, an admin at
              the department will create your account for you.
            </Faq>
            <Faq q="Does it drain my battery?">
              No — you only open Smartance for a second or two per class. There&apos;s no
              background app running.
            </Faq>
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------- Final CTA */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h3 className="text-3xl font-bold sm:text-4xl">Ready to skip the paper?</h3>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          It takes less than a minute to sign up. You&apos;ll be ready before your next class.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {roleHome ? (
            <Link
              href={roleHome}
              className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-base font-medium text-white hover:bg-primary-hover"
            >
              Open my dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-base font-medium text-white hover:bg-primary-hover"
              >
                Create my student account
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-md border border-border bg-surface px-6 text-base font-medium hover:bg-border/40"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* -------------------------------------------------- Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/oui-logo.png" alt="OUI" width={36} height={36} />
            <div>
              <p className="text-sm font-semibold">Smartance</p>
              <p className="text-xs text-text-muted">
                Department of Computer Engineering · Oduduwa University Ipetumodu
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-text-muted">
            <a href="#how-it-works" className="hover:text-primary">
              How it works
            </a>
            <a href="#faq" className="hover:text-primary">
              FAQ
            </a>
            <Link href="/login" className="hover:text-primary">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-primary">
              Register
            </Link>
          </div>
        </div>
        <p className="mx-auto max-w-6xl px-6 pb-8 text-xs text-text-muted">
          Final year project by Bolarinwa Adeyemi Ogheneochuko (H/24/CS/0023),
          supervised by Miss Oluyemi Sadare.
        </p>
      </footer>
    </div>
  );
}

/* ----------------------------------------------------- small building blocks */

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-3xl font-bold text-primary">{number}</p>
      <p className="mt-1 text-sm text-text-muted">{label}</p>
    </div>
  );
}

function Step({
  number,
  title,
  body,
}: {
  number: number;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-xl border border-border bg-surface p-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
        {number}
      </div>
      <h4 className="mt-4 text-lg font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-text-muted">{body}</p>
    </li>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        aria-hidden
        className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        ✓
      </span>
      <span className="text-text">{children}</span>
    </li>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg p-5">
      <dt className="text-base font-semibold">{q}</dt>
      <dd className="mt-2 text-sm text-text-muted">{children}</dd>
    </div>
  );
}
