// Brain Link memory integration — connects to Supabase Open Brain for recall/remember

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

export function isBrainConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_KEY);
}

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };
}

export async function brainRecall(query: string): Promise<string> {
  // Search memories via Supabase RPC (match_memories function)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_memories`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      query_text: query,
      match_count: 5,
    }),
  });

  if (!res.ok) {
    // Fallback: direct text search on memories table
    const fallbackRes = await fetch(
      `${SUPABASE_URL}/rest/v1/memories?content=ilike.*${encodeURIComponent(query)}*&select=content,tags,created_at&order=created_at.desc&limit=5`,
      { headers: headers() },
    );
    if (!fallbackRes.ok) {
      return `Memory search failed: ${res.status}`;
    }
    const rows = (await fallbackRes.json()) as {
      content: string;
      tags?: string[];
      created_at: string;
    }[];
    if (!rows.length) return "No memories found for that query.";
    return rows
      .map(
        (r) =>
          `[${r.created_at}] ${r.content}${r.tags?.length ? ` (tags: ${r.tags.join(", ")})` : ""}`,
      )
      .join("\n\n");
  }

  const results = (await res.json()) as {
    content: string;
    similarity: number;
    tags?: string[];
  }[];
  if (!results.length) return "No memories found for that query.";

  return results
    .map(
      (r) =>
        `[similarity: ${(r.similarity * 100).toFixed(0)}%] ${r.content}${r.tags?.length ? ` (tags: ${r.tags.join(", ")})` : ""}`,
    )
    .join("\n\n");
}

export async function brainRemember(
  content: string,
  tags?: string[],
): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({
      content,
      tags: tags || [],
      source: "brainlink-cowork",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return `Failed to store memory: ${res.status} ${text}`;
  }

  return `Memory stored successfully.${tags?.length ? ` Tags: ${tags.join(", ")}` : ""}`;
}
