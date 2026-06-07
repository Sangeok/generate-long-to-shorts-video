import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | LongformShorts AI",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
            Welcome, {session.user.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {session.user.email}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/" />} variant="outline">
          Back to home
        </Button>
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
    </main>
  );
}
