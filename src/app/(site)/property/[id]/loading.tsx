// OwnState — Property detail loading skeleton (Brick 15)

import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyLoading() {
  return (
    <div className="container-page py-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-4 h-9 w-2/3 max-w-xl" />
      <Skeleton className="mt-5 aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
