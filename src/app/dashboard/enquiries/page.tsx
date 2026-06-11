// OwnState — Dashboard · Enquiries (Brick 11)

import Link from "next/link";
import { Phone, Mail } from "lucide-react";

import { getEnquiriesForOwner } from "@/lib/actions/enquiries";

export const metadata = { title: "Enquiries" };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN");
}

export default async function EnquiriesPage() {
  const enquiries = await getEnquiriesForOwner();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
        <p className="text-muted-foreground">
          {enquiries.length} {enquiries.length === 1 ? "enquiry" : "enquiries"} on
          your listings
        </p>
      </div>

      {enquiries.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="font-medium">No enquiries yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enquiries from interested buyers and renters will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {enquiries.map((e) => (
            <li key={e.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {e.property?.cover_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.property.cover_image}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{e.name || "Someone"}</div>
                      {e.property && (
                        <Link
                          href={`/property/${e.property.id}`}
                          className="text-xs text-muted-foreground hover:text-brand-teal"
                        >
                          re: {e.property.title}
                        </Link>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(e.created_at)}
                    </span>
                  </div>
                  {e.message && (
                    <p className="mt-2 text-sm text-foreground/90">{e.message}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {e.phone && (
                      <a
                        href={`tel:${e.phone}`}
                        className="inline-flex items-center gap-1.5 font-medium text-brand-teal hover:underline"
                      >
                        <Phone className="size-3.5" /> {e.phone}
                      </a>
                    )}
                    <a
                      href={`https://wa.me/${(e.phone ?? "").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="size-3.5" /> Reply
                    </a>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
