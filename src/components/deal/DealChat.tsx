"use client";

// OwnState — Deal Room chat (Brick 13)
// Real messages from public.messages. Send via the sendMessage server action,
// then refresh to pull the persisted row. Buyer and seller only (RLS-enforced).

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/lib/actions/deals";
import type { Message } from "@/types/database";

export function DealChat({
  dealId,
  messages,
  viewerId,
  names,
}: {
  dealId: string;
  messages: Message[];
  viewerId: string;
  /** sender_id → display name */
  names: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    startTransition(async () => {
      try {
        await sendMessage(dealId, body);
        setDraft("");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't send message");
      }
    });
  }

  return (
    <div className="flex flex-col rounded-2xl border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Deal chat</h3>
      </div>

      <ul className="flex max-h-96 min-h-48 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <li className="my-auto text-center text-sm text-muted-foreground">
            No messages yet. Say hello to get the deal moving.
          </li>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === viewerId;
            return (
              <li
                key={m.id}
                className={cn("flex flex-col", mine ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "bg-brand-teal text-white"
                      : "bg-muted text-foreground"
                  )}
                >
                  {m.body}
                </div>
                <span className="mt-1 px-1 text-[11px] text-muted-foreground">
                  {mine ? "You" : names[m.sender_id] ?? "Counterparty"} ·{" "}
                  {new Date(m.created_at).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            );
          })
        )}
      </ul>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          maxLength={2000}
          className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" size="icon" disabled={pending || !draft.trim()}>
          <Send className="size-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
