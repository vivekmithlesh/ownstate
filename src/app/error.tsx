"use client";

// OwnState — route error boundary (Brick 15). Themed, with a retry.

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for monitoring; replace with a real logger in production.
    console.error(error);
  }, [error]);

  return (
    <main className="bg-space-radial text-brand-light">
      <div className="container-page flex min-h-svh flex-col items-center justify-center py-24 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-brand-accent">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="mt-6 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Something went wrong.
        </h1>
        <p className="mt-3 max-w-md text-brand-pale">
          An unexpected error interrupted this page. You can try again, or head
          back home.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-brand-pale/60">Ref: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={reset} className="bg-brand-teal text-white hover:bg-brand">
            <RotateCcw /> Try again
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/" />}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <Home /> Back home
          </Button>
        </div>
      </div>
    </main>
  );
}
