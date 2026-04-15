import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// MCP Protocol Handler
const mcpTools = {
  file_read: async (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  
  file_write: async (filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true, message: `File written to ${filePath}` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  
  api_call: async (service, endpoint, method = 'GET', body = null) => {
    try {
      const config = {
        method,
        url: endpoint,
        headers: {
          'Authorization': `Bearer ${process.env[`${service.toUpperCase()}_API_KEY`]}`,
          'Content-Type': 'application/json'
        }
      };
      if (body) config.data = body;
      
      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  
  task_route: async (task, complexity) => {
    const model = complexity === 'simple' ? 'claude-3-5-haiku-20241022' : 'claude-3-5-opus-20241022';
    return { success: true, model, task };
  }
};

// MCP Endpoint
app.post('/mcp', async (req, res) => {
  const { tool, params } = req.body;
  
  if (!mcpTools[tool]) {
    return res.status(400).json({ error: `Unknown tool: ${tool}` });
  }
  
  try {
    const result = await mcpTools[tool](...Object.values(params));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'MCP Server running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Brain Link MCP Server running on port ${PORT}`);
  console.log('Ready to bridge Brain Link, Claude Desktop, and desktop automation');
});
