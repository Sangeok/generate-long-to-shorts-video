"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  Clapperboard,
  Gem,
  House,
  Play,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: House },
  { label: "My Videos", href: "/dashboard/videos", icon: Clapperboard },
  { label: "Schedule Post", href: "/dashboard/schedule", icon: CalendarClock },
  { label: "Pricing", href: "/dashboard/pricing", icon: Gem },
] as const;

const SETTINGS_HREF = "/dashboard/settings";

interface AppSidebarUser {
  name: string;
  email: string;
  image?: string | null;
}

interface AppSidebarProps {
  user: AppSidebarUser;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      {/* Brand lockup — the single amber spot at the top of the stage. */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="LongformShorts AI"
              render={<Link href="/dashboard" />}
              className="gap-2.5 hover:bg-transparent active:bg-transparent"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-primary text-primary-foreground">
                <Play className="size-3.5 fill-current" />
              </span>
              <div className="grid flex-1 leading-tight">
                <span className="font-display text-base font-semibold tracking-tight">
                  LongformShorts <span className="text-primary">AI</span>
                </span>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Studio
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono uppercase tracking-[0.2em]">
            Workspace
          </SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <SidebarMenuItem key={item.href}>
                  {/* Amber rail marks the active route — the one moving accent. */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary group-data-[collapsible=icon]:hidden"
                    />
                  )}
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                    className={cn(isActive && "text-foreground")}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user identity doubles as the entry to settings. */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="User settings"
              isActive={pathname.startsWith(SETTINGS_HREF)}
              render={<Link href={SETTINGS_HREF} />}
            >
              <Avatar size="sm" className="shrink-0">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 leading-tight">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <Settings className="ml-auto text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
