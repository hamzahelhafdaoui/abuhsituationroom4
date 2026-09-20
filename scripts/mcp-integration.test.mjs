import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
test("upstream MCP tools execute through the real stdio protocol", async () => {
  const client = new Client({ name: "ahsr-test", version: "1" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["scripts/mcp-server.mjs"],
    stderr: "inherit",
  });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.equal(tools.length, 16);
    assert.ok(tools.some((t) => /search.*docs/.test(t.name)));
    assert.ok(!tools.some((t) => /create_token|delete|upload/.test(t.name)));
    const buffer = await client.callTool({
      name: "buffer_tool",
      arguments: { geometry: [32.5, 15.6], distance: 1, units: "kilometers" },
    });
    assert.equal(buffer.isError, false);
    assert.ok(buffer.structuredContent.bufferedPolygon[0].length > 4);
    const validationName = tools.find((t) => /validate_geojson/.test(t.name)).name;
    const validation = await client.callTool({
      name: validationName,
      arguments: { geojson: { type: "Point", coordinates: [32.5, 15.6] } },
    });
    assert.equal(validation.structuredContent.valid, true);
  } finally {
    await client.close();
  }
});
