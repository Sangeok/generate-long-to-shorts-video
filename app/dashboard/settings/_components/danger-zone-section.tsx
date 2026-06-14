"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/features/settings/actions";
import { authClient } from "@/lib/auth-client";

export const DangerZoneSection = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      // 세션은 cascade로 삭제됨 — 쿠키 정리는 best-effort.
      await authClient.signOut().catch(() => {});
      window.location.href = "/sign-in";
    } catch {
      setIsDeleting(false);
      toast.error("Couldn't delete your account.");
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-destructive">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account, all projects, shorts, and uploaded
          videos. This cannot be undone.
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger
          render={<Button variant="destructive" className="self-start" />}
        >
          Delete account
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account and every project, short, and uploaded video are
              removed for good. This action is permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
