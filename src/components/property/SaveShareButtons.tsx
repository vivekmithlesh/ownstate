"use client";

// OwnState — Save + Share buttons for the property header (Brick 09)

import { useState, useTransition } from "react";
import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toggleSaved } from "@/lib/actions/saved";

export function SaveShareButtons({
  propertyId,
  title,
  initialSaved = false,
}: {
  propertyId: string;
  title: string;
  initialSaved?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function onSave() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      try {
        const result = await toggleSaved(propertyId);
        setSaved(result);
        toast.success(result ? "Saved" : "Removed from saved");
      } catch (err) {
        setSaved(!next);
        toast.error(err instanceof Error ? err.message : "Couldn't save");
      }
    });
  }

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      // user cancelled the share sheet — ignore
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="lg" onClick={onSave} disabled={pending}>
        <Heart
          className={cn(saved && "fill-rose-500 text-rose-500")}
        />
        {saved ? "Saved" : "Save"}
      </Button>
      <Button variant="outline" size="lg" onClick={onShare}>
        <Share2 /> Share
      </Button>
    </div>
  );
}
