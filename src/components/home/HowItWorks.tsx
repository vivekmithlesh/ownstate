"use client";

// OwnState — How It Works (Brick 07)
// Buyer / Seller tab switch with a 3-step flow each.

import { useState } from "react";
import {
  Search,
  CalendarCheck,
  Handshake,
  ListPlus,
  ShieldCheck,
  Banknote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Step = { icon: LucideIcon; title: string; body: string };

const FLOWS: Record<"buyer" | "seller", Step[]> = {
  buyer: [
    {
      icon: Search,
      title: "Discover online",
      body: "Search real listings on an interactive map with live market rates — no agent, no physical visit needed.",
    },
    {
      icon: CalendarCheck,
      title: "Enquire & schedule",
      body: "Save favourites, ask the owner questions and book a visit or a video tour in a couple of taps.",
    },
    {
      icon: Handshake,
      title: "Close in the Deal Room",
      body: "Pay a token, sign the agreement and complete payment securely — every step tracked end to end.",
    },
  ],
  seller: [
    {
      icon: ListPlus,
      title: "List in minutes",
      body: "Add photos, location and price with our guided wizard. Reach buyers and renters across the country.",
    },
    {
      icon: ShieldCheck,
      title: "Fence your land",
      body: "Draw your boundary on the map, link your documents and protect your plot forever with Digital Land Fencing.",
    },
    {
      icon: Banknote,
      title: "Get paid securely",
      body: "Manage enquiries and deals from your dashboard and receive token and final payments with confidence.",
    },
  ],
};

export function HowItWorks() {
  const [tab, setTab] = useState<"buyer" | "seller">("buyer");

  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border bg-muted p-1">
          {(["buyer", "seller"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "buyer" ? "I'm buying / renting" : "I'm selling / listing"}
            </button>
          ))}
        </div>
      </div>

      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {FLOWS[tab].map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="relative rounded-2xl border bg-card p-6"
            >
              <span className="absolute right-5 top-5 text-5xl font-semibold text-muted/60">
                {i + 1}
              </span>
              <span className="grid size-11 place-items-center rounded-xl bg-brand-light text-brand-teal">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
