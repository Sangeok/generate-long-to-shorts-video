import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUserSettings } from "@/features/settings/server";
import { getCurrentSession } from "@/lib/auth-server";

import { DangerZoneSection } from "./_components/danger-zone-section";
import { GenerationDefaultsForm } from "./_components/generation-defaults-form";
import { ProfileSection } from "./_components/profile-section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings | LongformShorts AI",
};

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  const settings = await getUserSettings(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-5 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl">
          Settings
        </h1>
      </header>

      <ProfileSection
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
      />

      <GenerationDefaultsForm
        language={settings.language}
        contentType={settings.contentType}
        captionStyle={settings.captionStyle}
      />

      <DangerZoneSection />
    </div>
  );
}
