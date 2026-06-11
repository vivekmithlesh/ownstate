"use client";

// OwnState — My listings table with real actions (Brick 11)

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Property, PropertyStatus } from "@/types/database";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { deleteProperty } from "@/lib/actions/properties";

const STATUS_STYLE: Record<PropertyStatus, string> = {
  active: "bg-brand-light text-brand-teal",
  pending_review: "bg-amber-100 text-amber-700",
  sold: "bg-muted text-muted-foreground",
  rented: "bg-muted text-muted-foreground",
  leased: "bg-muted text-muted-foreground",
  inactive: "bg-muted text-muted-foreground",
};

function statusLabel(s: PropertyStatus) {
  return s === "pending_review" ? "Pending review" : s;
}

export function ListingsTable({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onDelete(p: Property) {
    if (!window.confirm(`Delete “${p.title}”? This can't be undone.`)) return;
    setPendingId(p.id);
    startTransition(async () => {
      try {
        await deleteProperty(p.id);
        toast.success("Listing deleted");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't delete");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Property</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Price</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {properties.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.cover_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.cover_image}
                        alt=""
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/property/${p.id}`}
                      className="line-clamp-1 font-medium hover:text-brand-teal"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {[p.locality, p.city].filter(Boolean).join(", ") || "—"}
                    </div>
                    {/* status inline on mobile */}
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize sm:hidden",
                        STATUS_STYLE[p.status]
                      )}
                    >
                      {statusLabel(p.status)}
                    </span>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    STATUS_STYLE[p.status]
                  )}
                >
                  {statusLabel(p.status)}
                </span>
              </td>
              <td className="hidden px-4 py-3 font-medium md:table-cell">
                {formatPrice(p.price, p.listing_type)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={`/property/${p.id}`} />}
                    aria-label="View"
                  >
                    <Eye />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(p)}
                    disabled={pendingId === p.id}
                    aria-label="Delete"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    {pendingId === p.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
