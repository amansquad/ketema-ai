"use client";

import { Bot, LoaderCircle, Send, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";

import { executeSceneCommands } from "@/features/ai-assistant/lib/commandExecutor";
import type { SceneCommand } from "@/features/ai-assistant/lib/commandSchema";
import { getCatalogEntry } from "@/features/assets/catalog/catalog";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import type { AssetKind, SceneObjectDraft } from "@/features/editor/types";
import { useTranslation } from "@/features/i18n/lib/useTranslation";

const EXAMPLE_PROMPTS = ["Create a residential district.", "Build a solar farm.", "Place ten schools."];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function summarize(drafts: SceneObjectDraft[]): string {
  if (drafts.length === 0) {
    return "I couldn't map that to anything placeable — try something like \"Create a residential district\" or \"Place ten schools.\"";
  }
  const counts = new Map<AssetKind, number>();
  for (const draft of drafts) {
    counts.set(draft.assetKind, (counts.get(draft.assetKind) ?? 0) + 1);
  }
  const parts = Array.from(counts.entries()).map(
    ([kind, count]) => `${count} ${getCatalogEntry(kind).label.toLowerCase()}${count > 1 ? "s" : ""}`,
  );
  return `Added ${drafts.length} object${drafts.length > 1 ? "s" : ""}: ${parts.join(", ")}.`;
}

export function AiAssistantPanel() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const addObjects = useEditorStore((state) => state.addObjects);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: "user", text: prompt }]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data: { commands?: SceneCommand[]; error?: string } = await response.json();

      if (!response.ok || !data.commands) {
        throw new Error(data.error ?? "Request failed");
      }

      const drafts = executeSceneCommands(data.commands);
      if (drafts.length > 0) addObjects(drafts);

      setMessages((prev) => [...prev, { id: `${Date.now()}-assistant`, role: "assistant", text: summarize(drafts) }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-assistant`, role: "assistant", text: "Something went wrong reaching the assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-300 shadow-lg backdrop-blur hover:bg-zinc-800 hover:text-white"
      >
        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        {t.assistant.askAi}
      </button>
    );
  }

  return (
    <div className="pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-zinc-800 bg-zinc-900/90 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5 text-xs font-semibold tracking-wide text-zinc-400 uppercase hover:text-white"
      >
        <span className="flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-emerald-400" />
          {t.assistant.title}
        </span>
        <span aria-hidden>×</span>
      </button>

      <div className="flex max-h-56 flex-col gap-2 overflow-y-auto px-3 py-2.5">
        {messages.length === 0 && (
          <div className="text-[11px] text-zinc-500">
            Try:
            <ul className="mt-1 space-y-1">
              {EXAMPLE_PROMPTS.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => setInput(example)}
                    className="text-left text-emerald-400 hover:underline"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((message) => (
          <p
            key={message.id}
            className={`text-xs ${message.role === "user" ? "text-zinc-200" : "text-zinc-400"}`}
          >
            <span className="font-semibold text-zinc-500">{message.role === "user" ? "You: " : "AI: "}</span>
            {message.text}
          </p>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 border-t border-zinc-800 p-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t.assistant.placeholder}
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </form>
    </div>
  );
}
