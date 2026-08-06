"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

import { useCreateShareLinkMutation } from "@/features/persistence/hooks/useShareLink";

export function ShareButton({ projectId }: { projectId: string }) {
  const createShareLink = useCreateShareLinkMutation();
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const result = await createShareLink.mutateAsync(projectId);
    const url = `${window.location.origin}/s/${result.shareLink.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={createShareLink.isPending}
      title="Create a public read-only link and copy it to your clipboard"
      className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-300 shadow-lg backdrop-blur transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-60"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
