// OwnState — Footer (Brick 06)

import Link from "next/link";
import { Globe2, Mail, Phone } from "lucide-react";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/search?listing=sell", label: "Buy property" },
      { href: "/search?listing=rent", label: "Rent a home" },
      { href: "/search?listing=lease", label: "Lease" },
      { href: "/search?luxury=1", label: "Luxury & islands" },
      { href: "/search?view=map", label: "Search on map" },
    ],
  },
  {
    title: "Owners",
    links: [
      { href: "/list-property", label: "List your property" },
      { href: "/dashboard/fencing", label: "Digital Land Fencing" },
      { href: "/dashboard/my-properties", label: "My listings" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About OwnState" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/contact", label: "Contact" },
      { href: "/legal/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-brand-dark text-brand-light">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-teal text-white">
              <Globe2 className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              OwnState
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-brand-pale">
            Own anything, anywhere on Earth. Buy, sell, rent &amp; lease any
            property — and protect your land forever with Digital Land Fencing.
          </p>
          <div className="mt-5 space-y-2 text-sm text-brand-pale">
            <a
              href="mailto:hello@ownstate.com"
              className="flex items-center gap-2 hover:text-white"
            >
              <Mail className="size-4" /> hello@ownstate.com
            </a>
            <a
              href="tel:+911800000000"
              className="flex items-center gap-2 hover:text-white"
            >
              <Phone className="size-4" /> 1800 000 000
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-white">{col.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-brand-pale transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-brand-pale sm:flex-row">
          <p>© {new Date().getFullYear()} OwnState. All rights reserved.</p>
          <p>Own Anything. Anywhere. On Earth.</p>
        </div>
      </div>
    </footer>
  );
}
