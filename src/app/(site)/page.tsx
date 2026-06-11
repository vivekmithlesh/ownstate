// OwnState — Home (Brick 07)
//
// Server Component. Real featured listings + real per-type counts. Interactive
// bits (hero search, how-it-works tabs, market ticker, reveals) are isolated
// client components. The static dark hero is replaced by the cinematic 3D Earth
// in Brick 14.

import Link from "next/link";
import { ArrowRight, ShieldCheck, Plane } from "lucide-react";

import {
  getProperties,
  getPropertyCountsByType,
} from "@/lib/actions/properties";
import { getSavedIds } from "@/lib/actions/saved";
import { PROPERTY_TYPES } from "@/lib/constants";
import { getPropertyIcon } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/PropertyCard";
import { Reveal } from "@/components/home/Reveal";
import { HowItWorks } from "@/components/home/HowItWorks";
import { MarketTicker } from "@/components/home/MarketTicker";
import EarthHero from "@/components/earth/EarthHero";

const TESTIMONIALS = [
  {
    quote:
      "I sold my Lucknow plot to a buyer in Bengaluru without a single site visit. The Deal Room made the paperwork painless.",
    name: "Rekha Srivastava",
    role: "Seller · Lucknow",
  },
  {
    quote:
      "Digital Land Fencing finally gave me proof of my boundary. I drew it on the map and linked my khasra papers in minutes.",
    name: "Harpreet Singh",
    role: "Landowner · Punjab",
  },
  {
    quote:
      "As an NRI I could browse, shortlist and pay the token from Dubai. OwnState felt built for buying from anywhere.",
    name: "Imran Qureshi",
    role: "Buyer · Dubai",
  },
];

export default async function HomePage() {
  const [featured, counts, savedIds] = await Promise.all([
    getProperties({ limit: 6, verified: true }),
    getPropertyCountsByType(),
    getSavedIds(),
  ]);
  const saved = new Set(savedIds);

  return (
    <>
      {/* --------------------------------------------- Cinematic video Earth hero */}
      <EarthHero />

      {/* -------------------------------------------------------- Browse by type */}
      <section className="section">
        <div className="container-page">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Browse by type
            </h2>
            <p className="mt-1 text-muted-foreground">
              Every kind of property — with live counts from real listings.
            </p>
          </Reveal>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {PROPERTY_TYPES.map((t, i) => {
              const Icon = getPropertyIcon(t.value);
              const count = counts[t.value] ?? 0;
              return (
                <Reveal key={t.value} delay={i * 0.03}>
                  <Link
                    href={`/search?type=${t.value}`}
                    className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 transition-colors hover:border-brand-accent hover:bg-brand-light/40"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-light text-brand-teal transition-colors group-hover:bg-brand-teal group-hover:text-white">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-medium">{t.label}</span>
                    <span className="mt-auto text-sm text-muted-foreground">
                      {count} {count === 1 ? "listing" : "listings"}
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- Land Fencing spot */}
      <section className="section">
        <div className="container-page">
          <Reveal>
            <div className="relative flex min-h-[22rem] items-center overflow-hidden rounded-3xl bg-brand-dark bg-[url('/fencing-bg.png')] bg-cover bg-center p-8 text-brand-light ring-1 ring-white/10 sm:p-12">
              {/* Readability scrim — concentrated behind the copy on the left
                  and fading out quickly to the right, so the white text stays
                  legible without flooding the whole satellite background. */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/55 to-transparent" />
              {/* Green glow boost — a soft neon wash lifted over the boundary so
                  the fence reads as luminous rather than flat. `mix-blend-screen`
                  only lightens the background, never the z-10 copy on top. */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_75%_at_60%_50%,rgba(93,202,165,0.45),transparent_70%)] mix-blend-screen" />

              <div className="relative z-10 max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-brand-pale backdrop-blur">
                  <ShieldCheck className="size-3.5 text-brand-accent" />
                  Signature feature
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  Digital Land Fencing
                </h2>
                <p className="mt-3 max-w-md text-brand-pale">
                  Mark your land&apos;s boundary on a satellite map, link your
                  government papers, and protect your plot forever. Your fence,
                  saved precisely with PostGIS.
                </p>
                <Button
                  size="lg"
                  render={<Link href="/dashboard/fencing" />}
                  className="mt-6 bg-brand-teal text-white hover:bg-brand"
                >
                  Fence your land <ArrowRight />
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------------------- Featured */}
      <section className="section pt-0">
        <div className="container-page">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Featured properties
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Verified listings — homes, plots, estates &amp; islands.
                </p>
              </div>
              <Button
                variant="ghost"
                render={<Link href="/search" />}
                className="hidden sm:inline-flex"
              >
                View all <ArrowRight />
              </Button>
            </div>
          </Reveal>

          {featured.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
              No verified listings yet. Run the Brick 03 seed and the Brick 05
              <code className="mx-1">functions.sql</code> to populate properties.
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((property, i) => (
                <Reveal key={property.id} delay={(i % 3) * 0.05}>
                  <PropertyCard
                    property={property}
                    initialSaved={saved.has(property.id)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------- How it works */}
      <section className="section bg-muted/40">
        <div className="container-page">
          <Reveal className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How OwnState works
            </h2>
            <p className="mx-auto mt-1 max-w-lg text-muted-foreground">
              A fully online journey — whether you&apos;re buying your first home
              or listing your family land.
            </p>
          </Reveal>
          <div className="mt-10">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ NRI banner */}
      <section className="section">
        <div className="container-page">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border bg-gradient-to-r from-brand-light to-white p-8 sm:flex-row sm:items-center sm:p-10">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-teal text-white">
                  <Plane className="size-6" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    Buying from abroad?
                  </h2>
                  <p className="mt-1 max-w-md text-muted-foreground">
                    OwnState is built for NRIs — discover, shortlist, enquire and
                    pay the token from anywhere in the world.
                  </p>
                </div>
              </div>
              <Button size="lg" render={<Link href="/search" />}>
                Explore for NRIs <ArrowRight />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------- Testimonials */}
      <section className="section pt-0">
        <div className="container-page">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Trusted across India &amp; beyond
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.05}>
                <figure className="flex h-full flex-col rounded-2xl border bg-card p-6">
                  <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Market ticker */}
      <MarketTicker />
    </>
  );
}
