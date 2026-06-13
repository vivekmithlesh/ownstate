// OwnState — Dashboard · Fenced land details (Brick 12)
// Server Component. Shows one saved boundary on a large map with its full
// record, plus a live "Get directions" route from the visitor's GPS.

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  MapPin,
  Ruler,
  ShieldCheck,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getBoundaryById } from "@/lib/actions/fencing";
import { FencingMapClient } from "@/components/fencing/FencingMapClient";
import { DirectionsButton } from "@/components/fencing/DirectionsButton";
import { polygonCentroid } from "@/lib/geo";

export const metadata = { title: "Fenced land" };

export default async function FencedLandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser(`/dashboard/fencing/${id}`);

  const land = await getBoundaryById(id);
  if (!land) notFound();

  const place = [land.village, land.tehsil, land.district, land.state]
    .filter(Boolean)
    .join(", ");
  const created = new Date(land.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const center = polygonCentroid(land.boundary);

  const facts: { label: string; value: string | null }[] = [
    { label: "Khasra number", value: land.khasra_number },
    { label: "Khata number", value: land.khata_number },
    { label: "Village", value: land.village },
    { label: "Tehsil", value: land.tehsil },
    { label: "District", value: land.district },
    { label: "State", value: land.state },
    { label: "Ownership", value: land.ownership_type },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/fencing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to fenced lands
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {land.land_name}
            {land.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-teal">
                <ShieldCheck className="size-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Pending
              </span>
            )}
          </h1>
          {place && (
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" /> {place}
            </p>
          )}
        </div>
        {center && (
          <DirectionsButton
            destLat={center.lat}
            destLng={center.lng}
            label="Get directions"
            variant="default"
            size="default"
          />
        )}
      </header>

      {/* Large interactive map */}
      <div className="h-[60vh] min-h-[360px] overflow-hidden rounded-2xl border">
        <FencingMapClient
          mode="view"
          value={land.boundary}
          className="h-full w-full"
        />
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={<Ruler className="size-5 text-brand-teal" />}
          label="Area"
          value={
            land.area_acres != null
              ? `${land.area_acres.toFixed(2)} acres`
              : "—"
          }
        />
        <Metric
          icon={<CalendarDays className="size-5 text-brand-teal" />}
          label="Fenced on"
          value={created}
        />
        <Metric
          icon={<FileText className="size-5 text-brand-teal" />}
          label="Documents"
          value={`${land.document_urls.length}`}
        />
      </div>

      {/* Full record */}
      <section className="rounded-2xl border">
        <h2 className="border-b px-5 py-3 font-medium">Land record</h2>
        <dl className="grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
          {facts
            .filter((f) => f.value)
            .map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          {land.notes && (
            <div className="space-y-0.5 sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd className="text-sm">{land.notes}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
