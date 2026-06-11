// OwnState — Auth page (Brick 04)
//
// Split-screen: cinematic brand panel (left) + Login/Sign Up form (right).
// Already-signed-in users are bounced straight to their destination.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, MapPin, Globe2 } from "lucide-react";

import { getUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in · OwnState",
  description: "Log in or create your OwnState account.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const { message, next } = await searchParams;

  const user = await getUser();
  if (user) redirect(next || "/dashboard");

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#05060a] p-10 text-[#E1F5EE] lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(1200px 600px at 20% 10%, #0F6E56 0%, transparent 55%), radial-gradient(900px 500px at 90% 90%, #0d2b1e 0%, transparent 60%)",
          }}
        />
        <Link
          href="/"
          className="relative z-10 inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <Globe2 className="size-5 text-[#5DCAA5]" />
          OwnState
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Own Anything.
            <br />
            Anywhere. On Earth.
          </h2>
          <p className="mt-4 text-[#9FE1CB]">
            Buy, sell, rent and lease any property on the planet — and protect
            your land forever with Digital Land Fencing.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-[#E1F5EE]/90">
            <Feature icon={<MapPin className="size-4 text-[#5DCAA5]" />}>
              Live search on a real interactive map
            </Feature>
            <Feature icon={<ShieldCheck className="size-4 text-[#5DCAA5]" />}>
              Fence your boundary &amp; link your documents
            </Feature>
            <Feature icon={<Globe2 className="size-4 text-[#5DCAA5]" />}>
              From a village plot to a private island
            </Feature>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-[#9FE1CB]/70">
          © {new Date().getFullYear()} OwnState
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-12">
        <AuthForm next={next} initialMessage={message} />
      </section>
    </main>
  );
}

function Feature({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
        {icon}
      </span>
      {children}
    </li>
  );
}
