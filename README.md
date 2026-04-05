# brainlink-cowork

MCP server bridging Brain Link and Claude Desktop via local Ollama (`Nilabh_yadav/Jarvis:latest`).

## Tools

| Tool | Description |
|------|-------------|
| `jarvis_chat` | Chat with local Jarvis model (stateful session) |
| `jarvis_analyze` | Analyze code/text with Jarvis (stateless) |
| `jarvis_summarize` | Summarize content with Jarvis |
| `jarvis_models` | List available Ollama models |
| `jarvis_pull` | Pull a model to local Ollama |
| `brain_recall` | Search Brain Link memory |
| `brain_remember` | Store a new memory |

## Setup

```bash
npm install
npm run build
```

## Claude Desktop Config

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "brainlink-cowork": {
      "command": "node",
      "args": ["C:/Users/Dell/Downloads/brainlink-cowork/dist/index.js"]
    }
  }
}
```

## Environment Variables (optional)

- `OLLAMA_URL` — Ollama endpoint (default: `http://localhost:11434`)
- `OLLAMA_MODEL` — Default model (default: `Nilabh_yadav/Jarvis:latest`)
- `SUPABASE_URL` — Open Brain Supabase URL (for memory tools)
- `SUPABASE_KEY` — Open Brain Supabase key (for memory tools)
