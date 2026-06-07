import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GoogleSignInCard } from "@/features/auth";
import { getCurrentSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Sign in | LongformShorts AI",
};

export default async function SignInPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-5 py-16">
      <GoogleSignInCard />
    </main>
  );
}
