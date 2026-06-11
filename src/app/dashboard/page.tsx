// OwnState — Dashboard (placeholder, Brick 04)
//
// Minimal authed landing page so the post-login flow works end-to-end.
// The real dashboard (stats, listings, enquiries, map) is built in Brick 11.

import { requireUser, getMyProfile } from "@/lib/auth";
import { UserMenu } from "@/components/UserMenu";

export const metadata = { title: "Dashboard · OwnState" };

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getMyProfile();

  const name = profile?.full_name?.trim() || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">OwnState</span>
        <UserMenu
          user={{
            name: profile?.full_name ?? null,
            email: user.email ?? "",
            avatarUrl: profile?.avatar_url ?? null,
          }}
        />
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome, {name} 👋
        </h1>
        <p className="mt-2 text-muted-foreground">
          You&apos;re signed in. This is a placeholder dashboard — the full
          experience (your properties, saved listings, enquiries and deals)
          arrives in Brick 11.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border p-4">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="mt-1 font-medium capitalize">
              {profile?.role ?? "buyer"}
            </dd>
          </div>
          <div className="rounded-xl border p-4">
            <dt className="text-muted-foreground">KYC status</dt>
            <dd className="mt-1 font-medium capitalize">
              {profile?.kyc_status ?? "unverified"}
            </dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
