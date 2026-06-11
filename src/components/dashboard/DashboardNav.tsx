"use client";

// OwnState — Dashboard navigation (Brick 11)
// Sidebar on lg+, fixed bottom tab bar on mobile.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Heart,
  MessageSquare,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] =
  [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/my-properties", label: "My listings", icon: Home },
    { href: "/dashboard/saved", label: "Saved", icon: Heart },
    { href: "/dashboard/enquiries", label: "Enquiries", icon: MessageSquare },
    { href: "/dashboard/fencing", label: "Land Fencing", icon: Shield },
  ];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({ variant }: { variant: "sidebar" | "bottom" }) {
  const pathname = usePathname();

  if (variant === "bottom") {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 backdrop-blur lg:hidden">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px]",
                active ? "text-brand-teal" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-light text-brand-teal"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
