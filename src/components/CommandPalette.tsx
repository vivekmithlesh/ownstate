"use client";

// OwnState — Cmd/Ctrl+K command palette (Brick 15)
// Quick navigation + live search over REAL properties (getProperties). No cmdk
// dependency — a focused, accessible dialog with full keyboard control.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Home,
  LayoutDashboard,
  PlusCircle,
  Shield,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { getProperties } from "@/lib/actions/properties";
import type { Property } from "@/types/database";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Search properties", href: "/search", icon: Search },
  { label: "List a property", href: "/list-property", icon: PlusCircle },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Land Fencing", href: "/dashboard/fencing", icon: Shield },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActive(0);
  }, []);

  // Global Cmd/Ctrl+K toggle.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus + scroll lock while open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Debounced live search over real listings.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const rows = await getProperties({ search: q, limit: 6 });
        if (id === reqId.current) {
          setResults(rows);
          setActive(0);
        }
      } catch {
        if (id === reqId.current) setResults([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  if (!open) return null;

  // Combined, ordered item list for keyboard navigation.
  const actionItems = query.trim()
    ? ACTIONS.filter((a) =>
        a.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : ACTIONS;
  const items: { href: string }[] = [
    ...actionItems.map((a) => ({ href: a.href })),
    ...results.map((p) => ({ href: `/property/${p.id}` })),
  ];

  function go(href: string) {
    close();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active].href);
    }
  }

  let cursor = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={close}
      />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border bg-popover shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search properties or jump to…"
            aria-label="Search"
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Quick actions */}
          {actionItems.length > 0 && (
            <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Jump to
            </div>
          )}
          {actionItems.map((a) => {
            const i = cursor++;
            const Icon = a.icon;
            return (
              <Row key={a.href} activeRow={i === active} onClick={() => go(a.href)}>
                <Icon className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm">{a.label}</span>
                {i === active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
              </Row>
            );
          })}

          {/* Property results */}
          {results.length > 0 && (
            <div className="mt-1 px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Properties
            </div>
          )}
          {results.map((p) => {
            const i = cursor++;
            const where = [p.locality, p.city].filter(Boolean).join(", ");
            return (
              <Row
                key={p.id}
                activeRow={i === active}
                onClick={() => go(`/property/${p.id}`)}
              >
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.cover_image ? (
                    <img
                      src={p.cover_image}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Home className="size-4 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {p.title}
                  </span>
                  {where && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {where}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm font-semibold text-brand-teal">
                  {formatPrice(p.price, p.listing_type)}
                </span>
              </Row>
            );
          })}

          {/* Empty state */}
          {query.trim() && !loading && items.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matches for “{query.trim()}”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  activeRow,
  onClick,
  children,
}: {
  activeRow: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
        activeRow ? "bg-muted" : "hover:bg-muted/60"
      )}
    >
      {children}
    </button>
  );
}
