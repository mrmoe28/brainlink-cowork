# Brain Link MCP Server

MCP server bridging Brain Link, Claude Desktop, and Moe's desktop automation ecosystem.

## Features
- **File System Operations**: Read, write, move, delete, watch directories
- **API Bridges**: Markate CRM, Square, Solar Ops, GitHub integrations
- **Task Routing**: Route simple tasks to Haiku, complex reasoning to Opus
- **Comms Sequences**: Schedule and manage automated follow-up emails
- **Desktop Automation**: Browser control, image processing, file operations
- **Real-time Sync**: Watch directories for incoming files (permits, invoices, images)

## Installation
```bash
npm install
npm start
```

## Environment Variables
```
GITHUB_TOKEN=your_token
MARKATE_API_KEY=your_key
SQUARE_API_KEY=your_key
SOLAR_OPS_API_KEY=your_key
PORT=3000
```

## API Endpoints

### POST /mcp
MCP protocol handler for all tools and operations.

Request:
```json
{
  "tool": "file_read",
  "params": {
    "filePath": "/path/to/file"
  }
}
```

### GET /health
Health check endpoint.

## Tools Available
- `file_read` - Read file contents
- `file_write` - Write content to files
- `api_call` - Make authenticated API calls
- `task_route` - Route tasks to appropriate Claude model

## Deployment
Deployed to Coolify at DigitalOcean (45.55.77.74)

## Architecture
- Node.js + MCP SDK
- Express for HTTP endpoints
- Axios for API calls
- File watchers for automation triggers

## Build Information
- Type: Node.js MCP Server
- Dependencies: @modelcontextprotocol/sdk, express, axios, dotenv
- Generator: Brain Link v2.2
- Date: March 2026
- License: MIT
