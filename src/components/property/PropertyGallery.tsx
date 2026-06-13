"use client";

// OwnState — Property image gallery (Brick 09)
// Large active image + thumbnail strip, built from the property's real images.

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function PropertyGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const photos = images.filter(Boolean);
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="grid aspect-[16/9] w-full place-items-center rounded-2xl bg-muted text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="size-8" />
          <span className="text-sm">No photos yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
        <Image
          src={photos[active]}
          alt={`${title} — photo ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                "relative aspect-[4/3] h-16 shrink-0 overflow-hidden rounded-lg ring-2 transition",
                i === active
                  ? "ring-brand-teal"
                  : "ring-transparent hover:ring-border"
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
