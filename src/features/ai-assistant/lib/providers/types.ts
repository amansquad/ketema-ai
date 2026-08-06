import type { SceneCommand } from "@/features/ai-assistant/lib/commandSchema";

/** The abstraction every AI provider implements — swap providers without touching the route or executor. */
export interface AiProvider {
  generateCommands(prompt: string): Promise<SceneCommand[]>;
}
