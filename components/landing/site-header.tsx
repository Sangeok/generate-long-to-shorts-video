"use client";

import * as React from "react";
import { Menu, Play } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

interface SiteHeaderProps {
  desktopAuthActions?: React.ReactNode;
  mobileAuthActions?: React.ReactNode;
}

function Wordmark() {
  return (
    <a href="#" className="group flex items-center gap-2.5">
      <span className="grid size-7 place-items-center rounded-[6px] bg-primary text-primary-foreground">
        <Play className="size-3.5 fill-current" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">
        LongformShorts <span className="text-primary">AI</span>
      </span>
    </a>
  );
}

function DesktopAuthFallback() {
  return (
    <>
      <Button
        nativeButton={false}
        variant="ghost"
        size="sm"
        render={<Link href="/sign-in" />}
      >
        Sign in
      </Button>
      <Button
        nativeButton={false}
        size="sm"
        render={<Link href="/sign-in" />}
      >
        Start free
      </Button>
    </>
  );
}

function MobileAuthFallback() {
  return (
    <>
      <Button
        nativeButton={false}
        variant="outline"
        render={<Link href="/sign-in" />}
      >
        Sign in
      </Button>
      <Button nativeButton={false} render={<Link href="/sign-in" />}>
        Start free
      </Button>
    </>
  );
}

export function SiteHeader({
  desktopAuthActions,
  mobileAuthActions,
}: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        isScrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Wordmark />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {desktopAuthActions ?? <DesktopAuthFallback />}
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Open menu" />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 gap-0 p-0">
              <div className="flex h-16 items-center px-5">
                <Wordmark />
              </div>
              <nav className="flex flex-col px-3 py-2">
                {NAV_LINKS.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={
                      <a
                        href={link.href}
                        className="rounded-md px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      />
                    }
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-border p-5">
                {mobileAuthActions ?? <MobileAuthFallback />}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
