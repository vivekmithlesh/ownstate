// OwnState — Dashboard layout (Brick 11)
// Own chrome (sidebar + mobile bottom tabs + header). Auth-gated.

import Link from "next/link";
import { Globe2 } from "lucide-react";

import { requireUser, getMyProfile } from "@/lib/auth";
import { UserMenu, type MenuUser } from "@/components/UserMenu";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/dashboard");
  const profile = await getMyProfile();

  const menuUser: MenuUser = {
    name: profile?.full_name ?? null,
    email: user.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
  };

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-teal text-white">
              <Globe2 className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              OwnState
            </span>
          </Link>
          <UserMenu user={menuUser} />
        </div>
      </header>

      <div className="container-page flex gap-8 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <DashboardNav variant="sidebar" />
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      <DashboardNav variant="bottom" />
    </div>
  );
}
