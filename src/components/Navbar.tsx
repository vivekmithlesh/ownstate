// OwnState — Navbar (server, Brick 06)
// Resolves the current user/profile on the server and hands it to the client
// shell so the menu reflects real auth state without a flash.

import { getUser, getMyProfile } from "@/lib/auth";
import { NavbarShell } from "@/components/NavbarShell";
import type { MenuUser } from "@/components/UserMenu";

export async function Navbar() {
  const [user, profile] = await Promise.all([getUser(), getMyProfile()]);

  const menuUser: MenuUser | null = user
    ? {
        name: profile?.full_name ?? null,
        email: user.email ?? "",
        avatarUrl: profile?.avatar_url ?? null,
      }
    : null;

  return <NavbarShell user={menuUser} />;
}
