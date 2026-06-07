import type { Metadata } from "next";

import { getCurrentSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | LongformShorts AI",
};

export default async function DashboardPage() {
  const session = await getCurrentSession();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
            Welcome, {session?.user.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {session?.user.email}
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Clips
          </p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
            0
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Minutes
          </p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
            0
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Aspect
          </p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
            9:16
          </p>
        </div>
      </section>
    </div>
  );
}
