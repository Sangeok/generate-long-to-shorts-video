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

  // mobile 플래그가 바꾸는 표현 차이의 전체 목록 — 여기 외의 분기는 없다.
  const presentation = mobile
    ? {
        size: "default" as const,
        className: "w-full",
        dashboardVariant: "default" as const,
        signOutVariant: "outline" as const,
      }
    : {
        size: "sm" as const,
        className: undefined,
        dashboardVariant: "ghost" as const,
        signOutVariant: "ghost" as const,
      };

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
          className={presentation.className}
          nativeButton={false}
          render={<Link href="/dashboard" />}
          size={presentation.size}
          variant={presentation.dashboardVariant}
        >
          <UserCircle />
          Dashboard
        </Button>
        <Button
          className={presentation.className}
          disabled={isSigningOut}
          onClick={handleSignOut}
          size={presentation.size}
          variant={presentation.signOutVariant}
        >
          <LogOut />
          Sign out
        </Button>
      </>
    );
  }

  return (
    <Button
      className={presentation.className}
      nativeButton={false}
      render={<Link href="/sign-in" />}
      size={presentation.size}
    >
      <LogIn />
      Start free
    </Button>
  );
}
