"use client";

// OwnState — List Property wizard (Brick 10)
//
// 7 steps: Type+Purpose → Basic Info → Location → Photos → Pricing → Documents
// → Review. Zod validation per step, draft persisted to localStorage, photos
// uploaded to Storage (real URLs), final publish via createProperty (REAL insert
// as pending_review with a PostGIS point).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import type {
  Furnishing,
  ListingType,
  PropertyType,
} from "@/types/database";
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  AMENITIES,
  FURNISHING_OPTIONS,
  CITIES,
  STATES,
} from "@/lib/constants";
import { cn, formatPrice, getPropertyIcon } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createProperty } from "@/lib/actions/properties";
import { uploadPropertyImage, uploadDocument } from "@/lib/storage";
import type { ResolvedAddress } from "@/components/list/LocationPicker";

const LocationPicker = dynamic(
  () => import("@/components/list/LocationPicker"),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-xl bg-muted" />,
  }
);

interface Draft {
  type?: PropertyType;
  listing_type?: ListingType;
  title: string;
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  area_unit: string;
  furnishing?: Furnishing;
  amenities: string[];
  lat?: number;
  lng?: number;
  address: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  images: string[];
  cover_image?: string;
  price?: number; // rupees
  rera_number: string;
}

const EMPTY: Draft = {
  title: "",
  description: "",
  area_unit: "sqft",
  amenities: [],
  address: "",
  locality: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  images: [],
  rera_number: "",
};

const STORAGE_KEY = "ownstate:list-draft:v1";
const STEP_LABELS = [
  "Type",
  "Details",
  "Location",
  "Photos",
  "Pricing",
  "Documents",
  "Review",
];

// Zod just decides validity per step; we supply the user-facing messages so we
// don't depend on Zod 4's schema-level message API (which differs from v3).
const stepSchemas = [
  z.object({ type: z.string().min(1), listing_type: z.string().min(1) }),
  z.object({
    title: z.string().trim().min(5),
    description: z.string().trim().min(20),
    area_sqft: z.number().positive().nullable().optional(),
  }),
  z.object({
    lat: z.number(),
    lng: z.number(),
    city: z.string().trim().min(1),
  }),
  z.object({ images: z.array(z.string()).min(1) }),
  z.object({ price: z.number().positive() }),
  z.object({}),
  z.object({}),
];

const MESSAGES: Record<string, string> = {
  type: "Select a property type",
  listing_type: "Select a purpose",
  title: "Title must be at least 5 characters",
  description: "Add a description of at least 20 characters",
  area_sqft: "Enter a valid area",
  location: "Pick the location on the map",
  city: "City is required",
  images: "Add at least one photo",
  price: "Enter a valid price",
};

function validateStep(step: number, d: Draft): Record<string, string> {
  const res = stepSchemas[step].safeParse(d);
  if (res.success) return {};
  const errs: Record<string, string> = {};
  for (const issue of res.error.issues) {
    const raw = String(issue.path[0] ?? "form");
    const key = raw === "lat" || raw === "lng" ? "location" : raw;
    errs[key] = MESSAGES[key] ?? issue.message;
  }
  return errs;
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function ListPropertyWizard({ userId }: { userId: string }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(0);
  const [docs, setDocs] = useState<{ name: string; path: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Restore + persist draft.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDraft({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const update = (patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  function next() {
    const errs = validateStep(step, draft);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onPickImages(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const url = await uploadPropertyImage(file, userId);
        setDraft((d) => ({
          ...d,
          images: [...d.images, url],
          cover_image: d.cover_image ?? url,
        }));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : `Upload failed: ${file.name}`
        );
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function removeImage(url: string) {
    setDraft((d) => {
      const images = d.images.filter((u) => u !== url);
      return {
        ...d,
        images,
        cover_image: d.cover_image === url ? images[0] : d.cover_image,
      };
    });
  }

  async function onPickDocs(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      try {
        const path = await uploadDocument(file, userId);
        setDocs((d) => [...d, { name: file.name, path }]);
        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : `Upload failed: ${file.name}`
        );
      }
    }
  }

  async function publish() {
    // Validate every data step; jump to the first one that fails.
    for (let s = 0; s <= 4; s++) {
      const errs = validateStep(s, draft);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setStep(s);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { id } = await createProperty({
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        type: draft.type!,
        listing_type: draft.listing_type!,
        price: Math.round((draft.price ?? 0) * 100), // rupees → paise
        lat: draft.lat ?? null,
        lng: draft.lng ?? null,
        area_sqft: draft.area_sqft ?? null,
        area_unit: draft.area_unit,
        bedrooms: draft.bedrooms ?? null,
        bathrooms: draft.bathrooms ?? null,
        furnishing: draft.furnishing ?? null,
        address: draft.address || null,
        locality: draft.locality || null,
        city: draft.city || null,
        state: draft.state || null,
        country: draft.country || "India",
        pincode: draft.pincode || null,
        amenities: draft.amenities,
        rera_number: draft.rera_number || null,
        cover_image: draft.cover_image ?? draft.images[0] ?? null,
        images: draft.images,
      });
      localStorage.removeItem(STORAGE_KEY);
      setCreatedId(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't publish");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdId) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-brand-light text-brand-teal">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Your listing is submitted!
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          It&apos;s now <strong>pending review</strong>. Once approved it&apos;ll
          appear in search. You can manage it from your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link href={`/property/${createdId}`} />}>
            View listing
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/dashboard/my-properties" />}
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        List your property
      </h1>

      {/* Stepper */}
      <ol className="mt-6 flex flex-wrap gap-2">
        {STEP_LABELS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                i === step
                  ? "bg-brand-teal text-white"
                  : i < step
                    ? "bg-brand-light text-brand-teal"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <span className="grid size-4 place-items-center rounded-full bg-white/20 text-[10px]">
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border bg-card p-6">
        {step === 0 && (
          <StepType draft={draft} update={update} errors={errors} />
        )}
        {step === 1 && (
          <StepDetails draft={draft} update={update} errors={errors} />
        )}
        {step === 2 && (
          <StepLocation
            draft={draft}
            update={update}
            errors={errors}
            map={
              <LocationPicker
                value={
                  draft.lat != null && draft.lng != null
                    ? { lat: draft.lat, lng: draft.lng }
                    : null
                }
                onChange={(lat, lng) => update({ lat, lng })}
                onResolved={(a: ResolvedAddress) =>
                  update({
                    address: a.address,
                    locality: a.locality || draft.locality,
                    city: a.city || draft.city,
                    state: a.state || draft.state,
                    pincode: a.pincode || draft.pincode,
                    country: a.country || draft.country,
                  })
                }
              />
            }
          />
        )}
        {step === 3 && (
          <StepPhotos
            draft={draft}
            uploading={uploading}
            onPick={onPickImages}
            onRemove={removeImage}
            onCover={(url) => update({ cover_image: url })}
            errors={errors}
          />
        )}
        {step === 4 && (
          <StepPricing draft={draft} update={update} errors={errors} />
        )}
        {step === 5 && (
          <StepDocuments
            draft={draft}
            update={update}
            docs={docs}
            onPick={onPickDocs}
          />
        )}
        {step === 6 && <StepReview draft={draft} />}
      </div>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          <ArrowLeft /> Back
        </Button>
        {step < STEP_LABELS.length - 1 ? (
          <Button size="lg" onClick={next}>
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button size="lg" onClick={publish} disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Publish listing
          </Button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- helpers */

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && !error && (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------- steps */

function StepType({
  draft,
  update,
  errors,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold">What are you listing?</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PROPERTY_TYPES.map((t) => {
            const Icon = getPropertyIcon(t.value);
            const active = draft.type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ type: t.value })}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                  active
                    ? "border-brand-teal bg-brand-light/50"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="size-5 text-brand-teal" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
        {errors.type && (
          <p className="mt-2 text-xs text-destructive">{errors.type}</p>
        )}
      </div>

      <div>
        <h2 className="font-semibold">Purpose</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {LISTING_TYPES.map((t) => {
            const active = draft.listing_type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ listing_type: t.value })}
                className={cn(
                  "h-10 rounded-lg border px-4 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-teal bg-brand-teal text-white"
                    : "hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {errors.listing_type && (
          <p className="mt-2 text-xs text-destructive">{errors.listing_type}</p>
        )}
      </div>
    </div>
  );
}

function StepDetails({
  draft,
  update,
  errors,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  errors: Record<string, string>;
}) {
  const num = (v: string) => (v === "" ? undefined : Number(v));
  return (
    <div className="space-y-5">
      <Field label="Title" error={errors.title}>
        <input
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="e.g. Sea-facing 3BHK in Bandra West"
          className={inputClass}
          aria-invalid={!!errors.title}
        />
      </Field>
      <Field label="Description" error={errors.description}>
        <textarea
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={4}
          placeholder="Describe the property, its highlights and surroundings…"
          className={cn(inputClass, "h-auto py-2")}
          aria-invalid={!!errors.description}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Bedrooms">
          <input
            type="number"
            min={0}
            value={draft.bedrooms ?? ""}
            onChange={(e) => update({ bedrooms: num(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Bathrooms">
          <input
            type="number"
            min={0}
            value={draft.bathrooms ?? ""}
            onChange={(e) => update({ bathrooms: num(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Area" error={errors.area_sqft}>
          <input
            type="number"
            min={0}
            value={draft.area_sqft ?? ""}
            onChange={(e) => update({ area_sqft: num(e.target.value) })}
            className={inputClass}
            placeholder="sq ft"
          />
        </Field>
        <Field label="Furnishing">
          <select
            value={draft.furnishing ?? ""}
            onChange={(e) =>
              update({ furnishing: (e.target.value || undefined) as Furnishing })
            }
            className={inputClass}
          >
            <option value="">—</option>
            {FURNISHING_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <span className="text-sm font-medium">Amenities</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const active = draft.amenities.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() =>
                  update({
                    amenities: active
                      ? draft.amenities.filter((x) => x !== a)
                      : [...draft.amenities, a],
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-brand-teal bg-brand-teal text-white"
                    : "hover:bg-muted"
                )}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepLocation({
  draft,
  update,
  errors,
  map,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  errors: Record<string, string>;
  map: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      {map}
      {errors.location && (
        <p className="text-xs text-destructive">{errors.location}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address">
          <input
            value={draft.address}
            onChange={(e) => update({ address: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Locality">
          <input
            value={draft.locality}
            onChange={(e) => update({ locality: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="City" error={errors.city}>
          <input
            list="cities"
            value={draft.city}
            onChange={(e) => update({ city: e.target.value })}
            className={inputClass}
            aria-invalid={!!errors.city}
          />
          <datalist id="cities">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="State">
          <input
            list="states"
            value={draft.state}
            onChange={(e) => update({ state: e.target.value })}
            className={inputClass}
          />
          <datalist id="states">
            {STATES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Pincode">
          <input
            value={draft.pincode}
            onChange={(e) => update({ pincode: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Country">
          <input
            value={draft.country}
            onChange={(e) => update({ country: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}

function StepPhotos({
  draft,
  uploading,
  onPick,
  onRemove,
  onCover,
  errors,
}: {
  draft: Draft;
  uploading: number;
  onPick: (files: FileList | null) => void;
  onRemove: (url: string) => void;
  onCover: (url: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground hover:bg-muted/50">
        <ImagePlus className="size-7" />
        <span className="text-sm font-medium text-foreground">
          Click to upload photos
        </span>
        <span className="text-xs">JPG / PNG — the first photo becomes cover</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
      </label>

      {uploading > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Uploading {uploading}…
        </p>
      )}
      {errors.images && (
        <p className="text-xs text-destructive">{errors.images}</p>
      )}

      {draft.images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {draft.images.map((url) => {
            const isCover = draft.cover_image === url;
            return (
              <div
                key={url}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                {isCover && (
                  <span className="absolute left-2 top-2 rounded-full bg-brand-teal px-2 py-0.5 text-[10px] font-medium text-white">
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onCover(url)}
                    className="grid size-7 place-items-center rounded-full bg-white/90 text-brand-dark hover:bg-white"
                    aria-label="Set as cover"
                  >
                    <Star className={cn("size-3.5", isCover && "fill-current")} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(url)}
                    className="grid size-7 place-items-center rounded-full bg-white/90 text-destructive hover:bg-white"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepPricing({
  draft,
  update,
  errors,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  errors: Record<string, string>;
}) {
  const isRent =
    draft.listing_type === "rent" || draft.listing_type === "lease";
  return (
    <div className="space-y-5">
      <Field
        label={isRent ? "Monthly amount (₹)" : "Price (₹)"}
        error={errors.price}
        hint={
          draft.price
            ? `Displayed as ${formatPrice(
                Math.round(draft.price * 100),
                draft.listing_type
              )}`
            : "Enter the amount in rupees"
        }
      >
        <input
          type="number"
          min={0}
          value={draft.price ?? ""}
          onChange={(e) =>
            update({ price: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder={isRent ? "e.g. 55000" : "e.g. 7200000"}
          className={inputClass}
          aria-invalid={!!errors.price}
        />
      </Field>
    </div>
  );
}

function StepDocuments({
  draft,
  update,
  docs,
  onPick,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  docs: { name: string; path: string }[];
  onPick: (files: FileList | null) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="RERA number (optional)" hint="If your project is RERA-registered.">
        <input
          value={draft.rera_number}
          onChange={(e) => update({ rera_number: e.target.value })}
          placeholder="e.g. P51800000123"
          className={inputClass}
        />
      </Field>

      <div>
        <span className="text-sm font-medium">Documents (optional)</span>
        <p className="text-xs text-muted-foreground">
          Uploaded to a private bucket for verification — never shown publicly.
        </p>
        <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50">
          <Upload className="size-4" />
          Upload ownership / RERA documents
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
        </label>
        {docs.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm">
            {docs.map((d) => (
              <li
                key={d.path}
                className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
              >
                <CheckCircle2 className="size-4 text-brand-teal" />
                <span className="truncate">{d.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StepReview({ draft }: { draft: Draft }) {
  const rows: [string, string][] = [
    ["Type", draft.type ?? "—"],
    ["Purpose", draft.listing_type ?? "—"],
    ["Title", draft.title || "—"],
    [
      "Price",
      draft.price
        ? formatPrice(Math.round(draft.price * 100), draft.listing_type)
        : "—",
    ],
    [
      "Location",
      [draft.locality, draft.city, draft.state].filter(Boolean).join(", ") ||
        "—",
    ],
    ["Photos", String(draft.images.length)],
    ["Amenities", draft.amenities.length ? draft.amenities.join(", ") : "—"],
    ["RERA", draft.rera_number || "—"],
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Review &amp; publish</h2>
      {draft.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={draft.cover_image}
          alt=""
          className="aspect-[16/9] w-full rounded-xl object-cover"
        />
      )}
      <dl className="divide-y rounded-xl border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium capitalize">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="rounded-lg bg-brand-light/60 px-3 py-2 text-xs text-brand-teal">
        Your listing will be submitted as <strong>pending review</strong>.
      </p>
    </div>
  );
}
