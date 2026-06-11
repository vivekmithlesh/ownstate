// OwnState — Deal Room (Brick 13)
// Server Component. Real deal between a buyer and seller: 5-stage progress,
// financial summary, document checklist, in-deal chat, timeline, and the
// current-stage action (pay token via Razorpay, or advance/cancel).

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { getDeal, getMessages } from "@/lib/actions/deals";
import { requireUser } from "@/lib/auth";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PayTokenButton } from "@/components/deal/PayTokenButton";
import { AdvanceDealButtons } from "@/components/deal/AdvanceDealButtons";
import { DealChat } from "@/components/deal/DealChat";
import { DEAL_STAGES, type DealStatus } from "@/types/database";

export const metadata = { title: "Deal room" };

const STAGE_LABEL: Record<DealStatus, string> = {
  interested: "Interested",
  token_paid: "Token paid",
  agreement_signed: "Agreement",
  registered: "Registered",
  complete: "Complete",
  cancelled: "Cancelled",
};

const CHECKLIST: { stage: DealStatus; label: string }[] = [
  { stage: "interested", label: "Buyer expressed interest" },
  { stage: "token_paid", label: "Booking token paid" },
  { stage: "agreement_signed", label: "Sale agreement signed" },
  { stage: "registered", label: "Registered at sub-registrar" },
  { stage: "complete", label: "Possession handed over" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/deal/${id}`);

  const room = await getDeal(id);
  if (!room) notFound();

  const messages = await getMessages(id);

  const { deal, property, buyer, seller, viewer, tokenAmount } = room;
  const status = deal.status;
  const cancelled = status === "cancelled";
  const currentIndex = DEAL_STAGES.indexOf(status); // -1 when cancelled

  const counterparty = viewer === "buyer" ? seller : buyer;
  const counterName = counterparty.full_name?.trim() || "Counterparty";
  const where = [property.locality, property.city, property.state]
    .filter(Boolean)
    .join(", ");

  const names: Record<string, string> = {
    [buyer.id]: buyer.full_name?.trim() || "Buyer",
    [seller.id]: seller.full_name?.trim() || "Seller",
  };

  const balance =
    deal.agreed_price != null ? deal.agreed_price - tokenAmount : null;

  return (
    <div className="container-page py-6">
      <Link
        href={`/property/${property.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to property
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-brand-teal capitalize text-white">
              {property.listing_type === "sell" ? "Purchase" : property.listing_type}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                cancelled && "border-destructive/40 text-destructive"
              )}
            >
              {STAGE_LABEL[status]}
            </Badge>
          </div>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight">
            {property.title}
          </h1>
          {where && (
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" /> {where}
            </p>
          )}
        </div>
      </div>

      {/* Cancelled banner */}
      {cancelled && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" />
          This deal was cancelled. Start a fresh enquiry from the property page if
          you&apos;d like to continue.
        </div>
      )}

      {/* Stage progress */}
      {!cancelled && (
        <ol className="mt-6 grid grid-cols-5 gap-2">
          {DEAL_STAGES.map((stage, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <li key={stage} className="flex flex-col items-center gap-2 text-center">
                <div className="flex w-full items-center">
                  <span
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      i === 0 ? "bg-transparent" : done || active ? "bg-brand-teal" : "bg-muted"
                    )}
                  />
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold",
                      done
                        ? "border-brand-teal bg-brand-teal text-white"
                        : active
                          ? "border-brand-teal text-brand-teal"
                          : "border-muted text-muted-foreground"
                    )}
                  >
                    {done ? <CheckCircle2 className="size-4" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      i === DEAL_STAGES.length - 1
                        ? "bg-transparent"
                        : done
                          ? "bg-brand-teal"
                          : "bg-muted"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium sm:text-xs",
                    active ? "text-brand-teal" : "text-muted-foreground"
                  )}
                >
                  {STAGE_LABEL[stage]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left: checklist + timeline + chat */}
        <div className="space-y-6 lg:col-span-2">
          {/* Document checklist */}
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Deal checklist</h2>
            <ul className="mt-3 space-y-2.5">
              {CHECKLIST.map((item) => {
                const reached =
                  !cancelled &&
                  DEAL_STAGES.indexOf(item.stage) <= currentIndex;
                return (
                  <li key={item.stage} className="flex items-center gap-2.5 text-sm">
                    {reached ? (
                      <CheckCircle2 className="size-4 shrink-0 text-brand-teal" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                    )}
                    <span
                      className={cn(
                        reached ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Timeline</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <span>Deal started · {fmtDate(deal.created_at)}</span>
              </li>
              {deal.token_paid_at && (
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 shrink-0 text-brand-teal" />
                  <span>Booking token paid · {fmtDate(deal.token_paid_at)}</span>
                </li>
              )}
            </ul>
          </section>

          {/* Chat */}
          <DealChat
            dealId={deal.id}
            messages={messages}
            viewerId={user.id}
            names={names}
          />
        </div>

        {/* Right: financials + action + counterparty */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-28 lg:space-y-6">
            {/* Financial summary */}
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold">Financial summary</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Agreed price</dt>
                  <dd className="font-semibold">
                    {deal.agreed_price != null
                      ? formatPrice(deal.agreed_price, deal.deal_type)
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Booking token</dt>
                  <dd className="font-medium">{formatPrice(tokenAmount)}</dd>
                </div>
                {balance != null && deal.deal_type === "sell" && (
                  <div className="flex items-center justify-between border-t pt-2.5">
                    <dt className="text-muted-foreground">Balance on registry</dt>
                    <dd className="font-medium">{formatPrice(balance)}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Current-stage action */}
            {!cancelled && (
              <section className="rounded-2xl border bg-card p-5">
                <h2 className="text-sm font-semibold">
                  {status === "complete" ? "Deal closed" : "Next step"}
                </h2>
                <div className="mt-3">
                  {status === "interested" ? (
                    viewer === "buyer" ? (
                      <PayTokenButton
                        dealId={deal.id}
                        amount={tokenAmount}
                        propertyTitle={property.title}
                        buyerName={buyer.full_name}
                        buyerEmail={user.email}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Waiting for the buyer to pay the booking token.
                      </p>
                    )
                  ) : status === "complete" ? (
                    <p className="flex items-center gap-2 text-sm text-brand-teal">
                      <CheckCircle2 className="size-4" /> This deal is complete.
                    </p>
                  ) : (
                    <AdvanceDealButtons dealId={deal.id} status={status} />
                  )}
                </div>
              </section>
            )}

            {/* Counterparty */}
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold">
                {viewer === "buyer" ? "Seller" : "Buyer"}
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-teal text-sm font-medium text-white">
                  {counterName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join("") || <User className="size-5" />}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{counterName}</div>
                  <div className="text-xs text-muted-foreground">
                    {viewer === "buyer" ? "Property owner" : "Prospective buyer"} ·
                    OwnState
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
