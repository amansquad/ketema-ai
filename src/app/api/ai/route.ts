import { NextResponse, type NextRequest } from "next/server";

import { getAiProvider } from "@/features/ai-assistant/lib/getProvider";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    const provider = getAiProvider();
    const commands = await provider.generateCommands(prompt);
    return NextResponse.json({ commands });
  } catch (error) {
    console.error("AI assistant provider error:", error);
    return NextResponse.json({ error: "The AI assistant failed to respond." }, { status: 502 });
  }
}
