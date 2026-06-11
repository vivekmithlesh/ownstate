// OwnState — Search page (Brick 08)
// Thin server wrapper: resolves URL params and hands them to the client view.

import type { Metadata } from "next";
import { SearchView } from "@/components/search/SearchView";

export const metadata: Metadata = {
  title: "Search properties",
  description:
    "Search real properties on an interactive map with live market rates.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(sp)) {
    params[key] = Array.isArray(value) ? value[0] : value;
  }

  return <SearchView initialParams={params} />;
}
