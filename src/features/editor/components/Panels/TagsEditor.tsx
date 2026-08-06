"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

export function TagsEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const tag = draft.trim().toLowerCase();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-zinc-800 py-0.5 pr-1 pl-2 text-[11px] text-zinc-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((existing) => existing !== tag))}
              className="rounded-full p-0.5 hover:bg-zinc-700 hover:text-white"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder="Add tag, press Enter"
        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-emerald-500"
      />
    </div>
  );
}
