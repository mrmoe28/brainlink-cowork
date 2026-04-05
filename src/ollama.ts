// Ollama client — talks to local Ollama instance using Nilabh_yadav/Jarvis:latest

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "Nilabh_yadav/Jarvis:latest";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function ollamaChat(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL,
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { num_ctx: 16384, temperature: 0.8 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content || "No response from model.";
}

export async function ollamaGenerate(
  prompt: string,
  model: string = DEFAULT_MODEL,
  system?: string,
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream: false,
      options: { num_ctx: 16384, temperature: 0.8 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { response?: string };
  return data.response || "No response from model.";
}

export async function ollamaListModels(): Promise<string[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/tags`);
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = (await res.json()) as { models?: { name: string }[] };
  return (data.models || []).map((m) => m.name);
}

export async function ollamaPull(model: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: model, stream: false }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama pull failed ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { status?: string };
  return data.status || "done";
}

export { DEFAULT_MODEL };
