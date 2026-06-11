// OwnState — Search loading skeleton (Brick 15)

import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="container-page py-6">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
        <Skeleton className="hidden h-[70vh] w-full rounded-2xl lg:block" />
      </div>
    </div>
  );
}
