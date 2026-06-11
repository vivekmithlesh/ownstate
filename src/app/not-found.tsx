// OwnState — 404 (Brick 15). Themed, on-brand deep-space panel.

import Link from "next/link";
import { Globe2, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-space-radial text-brand-light">
      <div className="container-page flex min-h-svh flex-col items-center justify-center py-24 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-brand-accent">
          <Globe2 className="size-7" />
        </span>
        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-brand-accent">
          404
        </p>
        <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          This corner of Earth isn&apos;t on the map yet.
        </h1>
        <p className="mt-3 max-w-md text-brand-pale">
          The page you&apos;re looking for moved or never existed. Let&apos;s get
          you back to solid ground.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/" />} className="bg-brand-teal text-white hover:bg-brand">
            <Home /> Back home
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/search" />}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <Search /> Browse properties
          </Button>
        </div>
      </div>
    </main>
  );
}
