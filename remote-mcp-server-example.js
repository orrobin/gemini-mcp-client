import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from "zod";
import axios from 'axios'

const mcpServer = new McpServer({
  name: "joke-remote-server",
  version: "1.0.0",
});

mcpServer.registerTool('tell_joke', {
  title: 'Tell joke',
  description: 'Returns a joke from the joke API given a word of inspiration',
  inputSchema: { hasInspiration: z.boolean(), inspiration: z.string() },
}, async ({ hasInspiration, inspiration }) => {

  const inspirationParam = hasInspiration ? `?contains=${inspiration}` : ''
  const endpoint = `https://v2.jokeapi.dev/joke/Any${inspirationParam}`

  try {

    console.log("Fetching joke")
    const result = await axios.get(endpoint)
    const data = result.data
    const textResponse = data.type === 'single' ? data.joke : `${data.setup}\n${data.delivery}`

    return { content: [{ type: 'text', text: textResponse }] }
  } catch (error) {
    return { content: [{ type: 'text', text: "No joke found" }] }
  }
})

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
  console.log("📨 Starting:", req.body.method);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on('close', () => {
    transport.close();
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
  console.log("Done with ", req.body.method)
});

const port = parseInt(process.env.PORT || '3543');

app.listen(port, () => {
  console.log(`MCP Server running on http://localhost:${port}/mcp`);
}).on('error', error => {
  console.error('Server error:', error);
  process.exit(1);
});