import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from 'axios'

const mcpServer = new McpServer({
  name: "joke-server",
  version: "1.0.0",
});

mcpServer.registerTool('tell_joke', {
  title: 'Tell joke',
  description: 'Returns a joke from the joke API given a word of inspiration',
  inputSchema: { hasInspiration: z.boolean(), inspiration: z.string() },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
  }
}, async ({ hasInspiration, inspiration }) => {

  const inspirationParam = hasInspiration ? `?contains=${inspiration}` : ''
  const endpoint = `https://v2.jokeapi.dev/joke/Any${inspirationParam}`

  try {
    const result = await axios.get(endpoint)
    const data = result.data
    const textResponse = data.type === 'single' ? data.joke : `${data.setup}\n${data.delivery}`

    return { content: [{ type: 'text', text: textResponse }] }
  } catch (error) {
    return { content: [{ type: 'text', text: "No joke found" }] }
  }
})

const transport = new StdioServerTransport();
await mcpServer.connect(transport);