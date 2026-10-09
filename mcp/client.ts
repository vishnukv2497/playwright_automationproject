import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function getMCPClient() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./mcp/server.js"]
  });

  const client = new Client(
    {
      name: "playwright-client",
      version: "1.0.0"
    },
    {
      capabilities: {}
    }
  );

  await client.connect(transport);

  return client;
}