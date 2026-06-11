// OwnState — Dashboard overview (Brick 11)

import Link from "next/link";
import {
  Home,
  CheckCircle2,
  Heart,
  MessageSquare,
  Plus,
  Shield,
  Search,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getMyProperties } from "@/lib/actions/properties";
import { getSavedProperties } from "@/lib/actions/saved";
import { getEnquiriesForOwner } from "@/lib/actions/enquiries";
import { getMyProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ListingsTable } from "@/components/dashboard/ListingsTable";
import { PropertyMapClient } from "@/components/dashboard/PropertyMapClient";

export const metadata = { title: "Dashboard" };

export default async function DashboardOverview() {
  const [properties, saved, enquiries, profile] = await Promise.all([
    getMyProperties(),
    getSavedProperties(),
    getEnquiriesForOwner(),
    getMyProfile(),
  ]);

  const active = properties.filter((p) => p.status === "active").length;
  const withLocation = properties.filter((p) => p.location);
  const name = profile?.full_name?.trim().split(" ")[0] || "there";

  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "Listings", value: properties.length, icon: Home },
    { label: "Active", value: active, icon: CheckCircle2 },
    { label: "Saved", value: saved.length, icon: Heart },
    { label: "Enquiries", value: enquiries.length, icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {name}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your properties.
          </p>
        </div>
        <Button size="lg" render={<Link href="/list-property" />}>
          <Plus /> List property
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border bg-card p-5">
              <Icon className="size-5 text-brand-teal" />
              <div className="mt-3 text-3xl font-semibold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          href="/list-property"
          icon={Plus}
          title="List a property"
          body="Reach buyers & renters across India."
        />
        <QuickAction
          href="/dashboard/fencing"
          icon={Shield}
          title="Fence your land"
          body="Protect your boundary digitally."
        />
        <QuickAction
          href="/search"
          icon={Search}
          title="Explore listings"
          body="Find your next property."
        />
      </div>

      {/* Map of my properties */}
      {withLocation.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your properties on the map</h2>
          <div className="h-80 overflow-hidden rounded-2xl border">
            <PropertyMapClient
              properties={withLocation}
              className="h-full w-full"
            />
          </div>
        </section>
      )}

      {/* Recent listings */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your listings</h2>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/dashboard/my-properties" />}
          >
            View all <ArrowRight />
          </Button>
        </div>
        {properties.length === 0 ? (
          <EmptyState
            title="No listings yet"
            body="List your first property to start reaching buyers."
            cta={{ href: "/list-property", label: "List a property" }}
          />
        ) : (
          <ListingsTable properties={properties.slice(0, 5)} />
        )}
      </section>

      {/* Recent enquiries */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent enquiries</h2>
        {enquiries.length === 0 ? (
          <EmptyState
            title="No enquiries yet"
            body="When someone enquires about your listings, it'll show up here."
          />
        ) : (
          <ul className="space-y-2">
            {enquiries.slice(0, 5).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {e.name || "Someone"}{" "}
                    <span className="font-normal text-muted-foreground">
                      enquired about
                    </span>{" "}
                    {e.property?.title ?? "a property"}
                  </div>
                  {e.message && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      {e.message}
                    </p>
                  )}
                </div>
                {e.phone && (
                  <a
                    href={`tel:${e.phone}`}
                    className="shrink-0 text-sm font-medium text-brand-teal hover:underline"
                  >
                    {e.phone}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-card p-5 transition-colors hover:border-brand-accent hover:bg-brand-light/40"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-brand-light text-brand-teal">
        <Icon className="size-5" />
      </span>
      <div className="mt-3 font-medium">{title}</div>
      <div className="text-sm text-muted-foreground">{body}</div>
    </Link>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {cta && (
        <Button className="mt-4" render={<Link href={cta.href} />}>
          {cta.label}
        </Button>
      )}
    </div>
  );
}
