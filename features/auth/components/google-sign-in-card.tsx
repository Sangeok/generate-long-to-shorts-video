"use client";

import { Loader2, LogIn } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GoogleSignInCard() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setErrorMessage(null);

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      errorCallbackURL: "/sign-in",
    });

    if (error) {
      setErrorMessage(error.message || "Google sign-in failed.");
    }
  };

  const handleSignIn = () => {
    startTransition(() => {
      void signInWithGoogle();
    });
  };

  return (
    <section className="w-full max-w-md rounded-xl border border-border bg-card p-6">
      <div className="space-y-2">
        <p className="eyebrow">Account</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Sign in to LongformShorts AI
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Continue with your Google account.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <Button
          className="w-full"
          disabled={isPending}
          onClick={handleSignIn}
          size="lg"
        >
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <LogIn />
          )}
          Continue with Google
        </Button>
        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
