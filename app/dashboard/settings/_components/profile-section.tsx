"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";

interface ProfileSectionProps {
  name: string;
  email: string;
  image?: string | null;
}

export const ProfileSection = ({ name, email, image }: ProfileSectionProps) => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const trimmed = displayName.trim();
  const isDirty = trimmed.length > 0 && trimmed !== name;

  const handleSaveName = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    const { error } = await authClient.updateUser({ name: trimmed });
    setIsSaving(false);
    if (error) {
      toast.error("Couldn't update your name.");
      return;
    }
    toast.success("Name updated.");
    router.refresh();
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details from Google sign-in.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          {image ? <AvatarImage src={image} alt={name} /> : null}
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="grid leading-tight">
          <span className="text-sm font-medium">{email}</span>
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
            Read-only
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="display-name">Display name</Label>
        <div className="flex items-center gap-2">
          <Input
            id="display-name"
            value={displayName}
            maxLength={80}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <Button
            type="button"
            onClick={handleSaveName}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex justify-start border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut /> {isSigningOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </section>
  );
};
