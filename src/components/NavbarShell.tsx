"use client";

// OwnState — Navbar (client shell, Brick 06)
//
// Desktop nav + mobile Sheet + UserMenu + "List Property" CTA. The current user
// is resolved on the server and passed in by Navbar.tsx.

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Menu, Plus, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserMenu, type MenuUser } from "@/components/UserMenu";

const NAV_LINKS = [
  { href: "/search?listing=sell", label: "Buy" },
  { href: "/search?listing=rent", label: "Rent" },
  { href: "/search?listing=lease", label: "Lease" },
  { href: "/search?luxury=1", label: "Luxury" },
  { href: "/search?view=map", label: "Map" },
];

export function NavbarShell({ user }: { user: MenuUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Announcement bar */}
      <div className="bg-brand-dark text-brand-light">
        <div className="container-page flex h-8 items-center justify-center gap-2 text-xs">
          <Sparkles className="size-3.5 text-brand-accent" />
          <span className="truncate">
            Now live across 10 Indian cities — fence your land digitally on
            OwnState.
          </span>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <nav className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-teal text-white">
              <Globe2 className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              OwnState
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Button
                key={link.label}
                variant="ghost"
                size="lg"
                render={<Link href={link.href} />}
                className={cn(
                  "text-sm",
                  pathname.startsWith("/search") &&
                    "data-[active]:text-foreground"
                )}
              >
                {link.label}
              </Button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/list-property" />}
              className="hidden sm:inline-flex"
            >
              <Plus />
              List Property
            </Button>

            <div className="hidden md:block">
              <UserMenu user={user} />
            </div>

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden" />
                }
                aria-label="Open menu"
              >
                <Menu />
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="border-b px-5 py-4 text-left text-base">
                  Menu
                </SheetTitle>
                <div className="flex flex-col gap-1 p-3">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  ))}

                  <Link
                    href="/list-property"
                    onClick={() => setOpen(false)}
                    className="mt-2 flex items-center gap-2 rounded-lg bg-brand-teal px-3 py-2.5 text-sm font-medium text-white"
                  >
                    <Plus className="size-4" />
                    List Property
                  </Link>
                </div>

                <div className="mt-auto border-t p-5">
                  {user ? (
                    <UserMenu user={user} />
                  ) : (
                    <Button
                      size="lg"
                      render={<Link href="/auth" />}
                      className="w-full"
                      onClick={() => setOpen(false)}
                    >
                      Sign in
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
