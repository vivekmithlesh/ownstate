"use client";

// OwnState — Contact panel for the property page (Brick 09)
// Seller info + Start Purchase (real createDeal) + Schedule Visit + Enquiry form.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarCheck, Loader2, ShieldCheck, User } from "lucide-react";

import type { ListingType, PropertyWithOwner } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createDeal } from "@/lib/actions/deals";
import { createEnquiry } from "@/lib/actions/enquiries";

const PURCHASE_LABEL: Record<ListingType, string> = {
  sell: "Start purchase",
  rent: "Rent this property",
  lease: "Start lease",
};

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  phone: z
    .string()
    .min(8, "Enter a valid phone number")
    .max(15, "Phone number is too long"),
  message: z.string().max(500, "Message is too long").optional(),
});
type FormValues = z.infer<typeof schema>;

export function ContactPanel({
  property,
  isAuthed,
  defaultName = "",
  defaultPhone = "",
}: {
  property: PropertyWithOwner;
  isAuthed: boolean;
  defaultName?: string;
  defaultPhone?: string;
}) {
  const router = useRouter();
  const [purchasing, startPurchase] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultName, phone: defaultPhone, message: "" },
  });

  const sellerName = property.owner?.full_name?.trim() || "Verified owner";
  const sellerInitials = sellerName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  function onStartPurchase() {
    if (!isAuthed) {
      router.push(`/auth?next=/property/${property.id}`);
      return;
    }
    startPurchase(async () => {
      try {
        const { id } = await createDeal({ propertyId: property.id });
        toast.success("Deal started");
        router.push(`/deal/${id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't start deal");
      }
    });
  }

  function onScheduleVisit() {
    setValue(
      "message",
      "I'd like to schedule a visit to this property. Please suggest a convenient time."
    );
    setFocus("message");
  }

  async function onSubmit(values: FormValues) {
    try {
      await createEnquiry({
        propertyId: property.id,
        name: values.name,
        phone: values.phone,
        message: values.message || null,
      });
      toast.success("Enquiry sent — the owner will get back to you.");
      reset({ name: values.name, phone: values.phone, message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send enquiry");
    }
  }

  return (
    <div id="contact" className="rounded-2xl border bg-card p-5 shadow-sm">
      {/* Price */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold text-brand-teal">
            {formatPrice(property.price, property.listing_type)}
          </div>
          {property.area_sqft ? (
            <div className="text-xs text-muted-foreground">
              ₹
              {Math.round(
                property.price / 100 / property.area_sqft
              ).toLocaleString("en-IN")}
              /sq ft
            </div>
          ) : null}
        </div>
        {property.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-1 text-xs font-medium text-brand-teal">
            <ShieldCheck className="size-3.5" /> Verified
          </span>
        )}
      </div>

      {/* Seller */}
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-teal text-sm font-medium text-white">
          {sellerInitials || <User className="size-5" />}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{sellerName}</div>
          <div className="text-xs capitalize text-muted-foreground">
            {property.owner?.role ?? "owner"} · OwnState
          </div>
        </div>
      </div>

      {/* Primary actions */}
      <div className="mt-4 grid gap-2">
        <Button size="lg" onClick={onStartPurchase} disabled={purchasing}>
          {purchasing && <Loader2 className="animate-spin" />}
          {PURCHASE_LABEL[property.listing_type]}
        </Button>
        <Button variant="outline" size="lg" onClick={onScheduleVisit}>
          <CalendarCheck /> Schedule a visit
        </Button>
      </div>

      {/* Enquiry form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3 border-t pt-5">
        <h3 className="text-sm font-semibold">Send an enquiry</h3>

        <div>
          <input
            {...register("name")}
            placeholder="Your name"
            aria-invalid={!!errors.name}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <input
            {...register("phone")}
            placeholder="Phone number"
            inputMode="tel"
            aria-invalid={!!errors.phone}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-destructive">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div>
          <textarea
            {...register("message")}
            rows={3}
            placeholder="I'm interested in this property…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {errors.message && (
            <p className="mt-1 text-xs text-destructive">
              {errors.message.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Send enquiry
        </Button>
      </form>
    </div>
  );
}
