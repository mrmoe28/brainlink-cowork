#!/usr/bin/env node

// brainlink-cowork — MCP server bridging Brain Link ↔ Claude Desktop via Ollama Jarvis
//
// Tools exposed to Claude Desktop:
//   jarvis_chat      — Chat with the local Jarvis model (Nilabh_yadav/Jarvis:latest)
//   jarvis_analyze   — Analyze code/text with Jarvis
//   jarvis_summarize — Summarize content with Jarvis
//   jarvis_models    — List available Ollama models
//   jarvis_pull      — Pull a model to local Ollama
//   brain_recall     — Search Brain Link memory (Supabase Open Brain)
//   brain_remember   — Store a memory in Brain Link

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  ollamaChat,
  ollamaGenerate,
  ollamaListModels,
  ollamaPull,
  DEFAULT_MODEL,
  type ChatMessage,
} from "./ollama.js";
import {
  brainRecall,
  brainRemember,
  isBrainConfigured,
} from "./brain.js";

const server = new McpServer({
  name: "brainlink-cowork",
  version: "1.0.0",
});

// ── Conversation state (per-session) ─────────────────────────────────────────
const history: ChatMessage[] = [];

const SYSTEM_PROMPT = `You are Jarvis, Moe's personal AI assistant running locally via Ollama. You are highly capable, witty, and concise. Address Moe as "Sir". You have access to Brain Link memory and can help with code analysis, planning, and general assistance.`;

// ── Tools ────────────────────────────────────────────────────────────────────

server.tool(
  "jarvis_chat",
  "Chat with the local Jarvis AI model. Maintains conversation history within the session.",
  { message: z.string().describe("The message to send to Jarvis") },
  async ({ message }) => {
    history.push({ role: "user", content: message });
    const msgs: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
    ];
    const reply = await ollamaChat(msgs);
    history.push({ role: "assistant", content: reply });
    return { content: [{ type: "text" as const, text: reply }] };
  },
);

server.tool(
  "jarvis_analyze",
  "Analyze code, text, or a problem using the local Jarvis model. Stateless — does not affect chat history.",
  {
    content: z.string().describe("The code or text to analyze"),
    instruction: z
      .string()
      .optional()
      .describe("Specific analysis instruction (default: general analysis)"),
  },
  async ({ content, instruction }) => {
    const prompt = instruction
      ? `${instruction}\n\n---\n\n${content}`
      : `Analyze the following and provide insights:\n\n${content}`;
    const reply = await ollamaGenerate(prompt, DEFAULT_MODEL, SYSTEM_PROMPT);
    return { content: [{ type: "text" as const, text: reply }] };
  },
);

server.tool(
  "jarvis_summarize",
  "Summarize content using the local Jarvis model.",
  {
    content: z.string().describe("The content to summarize"),
    style: z
      .enum(["brief", "detailed", "bullets"])
      .optional()
      .describe("Summary style (default: brief)"),
  },
  async ({ content, style }) => {
    const styleMap = {
      brief: "Provide a concise 2-3 sentence summary.",
      detailed: "Provide a thorough summary covering all key points.",
      bullets: "Summarize as a bulleted list of key points.",
    };
    const instruction = styleMap[style || "brief"];
    const reply = await ollamaGenerate(
      `${instruction}\n\n${content}`,
      DEFAULT_MODEL,
      SYSTEM_PROMPT,
    );
    return { content: [{ type: "text" as const, text: reply }] };
  },
);

server.tool(
  "jarvis_models",
  "List all models available on the local Ollama instance.",
  {},
  async () => {
    const models = await ollamaListModels();
    const text = models.length
      ? `Available models:\n${models.map((m) => `  - ${m}`).join("\n")}`
      : "No models found. Is Ollama running?";
    return { content: [{ type: "text" as const, text }] };
  },
);

server.tool(
  "jarvis_pull",
  "Pull/download a model to the local Ollama instance.",
  { model: z.string().describe("Model name to pull (e.g. llama3.2:3b)") },
  async ({ model }) => {
    const status = await ollamaPull(model);
    return {
      content: [{ type: "text" as const, text: `Pull ${model}: ${status}` }],
    };
  },
);

server.tool(
  "brain_recall",
  "Search Brain Link memory (Open Brain / Supabase) for relevant context about Moe's projects, decisions, and knowledge.",
  { query: z.string().describe("Search query for memory recall") },
  async ({ query }) => {
    if (!isBrainConfigured()) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Brain Link memory not configured. Set SUPABASE_URL and SUPABASE_KEY env vars.",
          },
        ],
      };
    }
    const results = await brainRecall(query);
    return { content: [{ type: "text" as const, text: results }] };
  },
);

server.tool(
  "brain_remember",
  "Store a new memory in Brain Link (Open Brain). Use for decisions, facts, project context.",
  {
    content: z.string().describe("The memory content to store"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Tags for categorization"),
  },
  async ({ content, tags }) => {
    if (!isBrainConfigured()) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Brain Link memory not configured. Set SUPABASE_URL and SUPABASE_KEY env vars.",
          },
        ],
      };
    }
    const result = await brainRemember(content, tags);
    return { content: [{ type: "text" as const, text: result }] };
  },
);

// ── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `brainlink-cowork MCP server running (model: ${DEFAULT_MODEL})`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
