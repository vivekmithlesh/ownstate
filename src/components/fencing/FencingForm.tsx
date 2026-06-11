"use client";

// OwnState — Land Fencing form (Brick 12)
// 3 steps: Draw boundary → Details → Documents → createBoundary.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Ruler,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FencingMapClient } from "@/components/fencing/FencingMapClient";
import { createBoundary } from "@/lib/actions/fencing";
import { uploadDocument } from "@/lib/storage";

const STEPS = ["Draw", "Details", "Documents"];
const OWNERSHIP = ["Freehold", "Leasehold", "Ancestral", "Joint", "Other"];

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

interface Details {
  landName: string;
  khasra: string;
  khata: string;
  village: string;
  tehsil: string;
  district: string;
  state: string;
  ownership: string;
  notes: string;
}

const EMPTY: Details = {
  landName: "",
  khasra: "",
  khata: "",
  village: "",
  tehsil: "",
  district: "",
  state: "",
  ownership: "",
  notes: "",
};

export function FencingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [geojson, setGeojson] = useState<string | null>(null);
  const [areaSqm, setAreaSqm] = useState(0);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [docs, setDocs] = useState<{ name: string; path: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const acres = areaSqm / 4046.86;
  const set = (patch: Partial<Details>) =>
    setDetails((d) => ({ ...d, ...patch }));

  function next() {
    if (step === 0 && !geojson) {
      toast.error("Draw your land boundary on the map first.");
      return;
    }
    if (step === 1 && !details.landName.trim()) {
      setNameError("Give your land a name");
      return;
    }
    setNameError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onPickDocs(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      try {
        const path = await uploadDocument(file, userId);
        setDocs((d) => [...d, { name: file.name, path }]);
        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    }
  }

  async function submit() {
    if (!geojson) {
      setStep(0);
      return;
    }
    if (!details.landName.trim()) {
      setStep(1);
      setNameError("Give your land a name");
      return;
    }
    setSubmitting(true);
    try {
      await createBoundary({
        landName: details.landName.trim(),
        geojson,
        khasraNumber: details.khasra || null,
        khataNumber: details.khata || null,
        village: details.village || null,
        tehsil: details.tehsil || null,
        district: details.district || null,
        state: details.state || null,
        ownershipType: details.ownership || null,
        notes: details.notes || null,
        documentUrls: docs.map((d) => d.path),
      });
      toast.success("Land fenced and saved!");
      // reset
      setGeojson(null);
      setAreaSqm(0);
      setDetails(EMPTY);
      setDocs([]);
      setStep(0);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save boundary");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      {/* Stepper */}
      <ol className="mb-5 flex gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              i === step
                ? "bg-brand-teal text-white"
                : i < step
                  ? "bg-brand-light text-brand-teal"
                  : "bg-muted text-muted-foreground"
            )}
          >
            <span className="grid size-4 place-items-center rounded-full bg-white/20 text-[10px]">
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Use the polygon tool (top-left of the map) to trace your land&apos;s
            boundary on the satellite view.
          </p>
          <div className="h-[420px] overflow-hidden rounded-xl border">
            <FencingMapClient
              mode="draw"
              onShape={(gj, a) => {
                setGeojson(gj);
                setAreaSqm(a);
              }}
              className="h-full w-full"
            />
          </div>
          {geojson && (
            <p className="flex items-center gap-2 rounded-lg bg-brand-light/60 px-3 py-2 text-sm text-brand-teal">
              <Ruler className="size-4" />
              Area: <strong>{acres.toFixed(2)} acres</strong> (
              {Math.round(areaSqm).toLocaleString("en-IN")} m²)
            </p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Land name</span>
            <input
              value={details.landName}
              onChange={(e) => set({ landName: e.target.value })}
              placeholder="e.g. Ancestral field, Village Rampur"
              className={inputClass}
              aria-invalid={!!nameError}
            />
            {nameError && (
              <span className="text-xs text-destructive">{nameError}</span>
            )}
          </label>
          <Input label="Khasra number" value={details.khasra} onChange={(v) => set({ khasra: v })} />
          <Input label="Khata number" value={details.khata} onChange={(v) => set({ khata: v })} />
          <Input label="Village" value={details.village} onChange={(v) => set({ village: v })} />
          <Input label="Tehsil" value={details.tehsil} onChange={(v) => set({ tehsil: v })} />
          <Input label="District" value={details.district} onChange={(v) => set({ district: v })} />
          <Input label="State" value={details.state} onChange={(v) => set({ state: v })} />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Ownership type</span>
            <select
              value={details.ownership}
              onChange={(e) => set({ ownership: e.target.value })}
              className={inputClass}
            >
              <option value="">—</option>
              {OWNERSHIP.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              value={details.notes}
              onChange={(e) => set({ notes: e.target.value })}
              rows={3}
              className={cn(inputClass, "h-auto py-2")}
            />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Link ownership documents (sale deed, khasra/khatauni). Stored
            privately for verification.
          </p>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50">
            <Upload className="size-4" />
            Upload documents
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onPickDocs(e.target.files)}
            />
          </label>
          {docs.length > 0 && (
            <ul className="space-y-1.5 text-sm">
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
      )}

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
        >
          <ArrowLeft /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="lg" onClick={next}>
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Save fenced land
          </Button>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}
