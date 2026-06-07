"use client";

import { LogIn, LogOut, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface AuthHeaderActionsProps {
  mobile?: boolean;
}

export function AuthHeaderActions({ mobile = false }: AuthHeaderActionsProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isSigningOut, startSignOutTransition] = useTransition();

  const buttonSize = mobile ? "default" : "sm";
  const fullWidthClassName = mobile ? "w-full" : undefined;

  const handleSignOut = () => {
    startSignOutTransition(() => {
      void authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/");
            router.refresh();
          },
        },
      });
    });
  };

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
    <Button
      className={fullWidthClassName}
      nativeButton={false}
      render={<Link href="/sign-in" />}
      size={buttonSize}
    >
      <LogIn />
      Start free
    </Button>
  );
}
