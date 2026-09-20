import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { installWorkbenchTools } from "./mcp-tools.mjs";
const server = new McpServer({ name: "ahsr-civilian-workbench", version: "1.0.0" });
installWorkbenchTools(server);
await server.connect(new StdioServerTransport());
