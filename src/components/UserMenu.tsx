"use client";

// OwnState — UserMenu (Brick 04)
//
// Shows a "Sign in" button when logged out, or an avatar dropdown when logged in
// (Dashboard / My Listings / Saved + Sign out). Sign out posts to the route
// handler at /auth/signout. Used by the Navbar (built in Brick 06).

import Link from "next/link";
import { LayoutDashboard, Home, Heart, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type MenuUser = {
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

export function UserMenu({ user }: { user: MenuUser | null }) {
  if (!user) {
    return (
      <Button size="lg" render={<Link href="/auth" />}>
        Sign in
      </Button>
    );
  }

  const display = user.name?.trim() || user.email;
  const initials = (user.name?.trim() || user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Account menu"
          />
        }
      >
        <Avatar className="size-9">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={display} />}
          <AvatarFallback>{initials || "U"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {user.name?.trim() || "Your account"}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/dashboard" />}>
          <LayoutDashboard />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/my-properties" />}>
          <Home />
          My listings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/saved" />}>
          <Heart />
          Saved
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action="/auth/signout" method="post">
          <DropdownMenuItem
            variant="destructive"
            closeOnClick={false}
            render={<button type="submit" className="w-full" />}
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
