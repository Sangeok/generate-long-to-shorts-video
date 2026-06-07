"use client";

import * as React from "react";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface AuthHeaderActionsProps {
  mobile?: boolean;
}

export function AuthHeaderActions({ mobile = false }: AuthHeaderActionsProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, startSignOutTransition] = React.useTransition();
  const buttonSize = mobile ? "default" : "sm";
  const fullWidthClassName = mobile ? "w-full" : undefined;

  function handleSignOut() {
    startSignOutTransition(() => {
      void authClient.signOut().then(() => {
        router.push("/");
        router.refresh();
      });
    });
  }

  if (isPending) {
    return (
      <>
        <Button
          className={fullWidthClassName}
          disabled
          size={buttonSize}
          variant={mobile ? "outline" : "ghost"}
        >
          <UserCircle />
          Sign in
        </Button>
        <Button className={fullWidthClassName} disabled size={buttonSize}>
          Start free
        </Button>
      </>
    );
  }

  if (session?.user) {
    return (
      <>
        <Button
          className={fullWidthClassName}
          nativeButton={false}
          render={<Link href="/dashboard" />}
          size={buttonSize}
          variant={mobile ? "default" : "ghost"}
        >
          <UserCircle />
          Dashboard
        </Button>
        <Button
          className={fullWidthClassName}
          disabled={isSigningOut}
          onClick={handleSignOut}
          size={buttonSize}
          variant={mobile ? "outline" : "ghost"}
        >
          <LogOut />
          Sign out
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        className={fullWidthClassName}
        nativeButton={false}
        render={<Link href="/sign-in" />}
        size={buttonSize}
        variant={mobile ? "outline" : "ghost"}
      >
        <LogIn />
        Sign in
      </Button>
      <Button
        className={fullWidthClassName}
        nativeButton={false}
        render={<Link href="/sign-in" />}
        size={buttonSize}
      >
        Start free
      </Button>
    </>
  );
}
