#!/usr/bin/env node
/**
 * MCP server: exposes a multi-tenant Supabase-style knowledge base as
 * Claude-Desktop-compatible tools.
 *
 * Ships with an in-memory KB (from seed.ts) so the server runs with zero
 * external setup. Replace the KB instance with a Supabase-backed one
 * when you plug in real data (see src/kb.ts -- it's a 30-line interface).
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { InMemoryKB, type KnowledgeBase } from "./kb.js";
import { SEED_DOCS } from "./seed.js";

const kb: KnowledgeBase = new InMemoryKB(SEED_DOCS);

const TOOLS = [
  {
    name: "kb_search",
    description:
      "Search the tenant's knowledge base for passages relevant to a natural-language query. Returns the top N hits with title, snippet, and score. Always filter by tenant_id -- there is no 'search across all tenants' mode (that's the point).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural-language query in any language" },
        tenant_id: {
          type: "string",
          description:
            "The tenant whose knowledge base to search. Use kb_list_tenants if unknown.",
        },
        limit: {
          type: "number",
          description: "Maximum number of hits to return (default 5)",
          default: 5,
        },
      },
      required: ["query", "tenant_id"],
    },
  },
  {
    name: "kb_get_document",
    description:
      "Fetch one full document by id, scoped to a tenant. Returns null if the document doesn't exist in that tenant.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Document id (e.g. 'cli-002')" },
        tenant_id: { type: "string", description: "Tenant id" },
      },
      required: ["id", "tenant_id"],
    },
  },
  {
    name: "kb_list_tenants",
    description:
      "List the tenant ids known to this KB. Useful in a demo / discovery flow -- in production this tool should usually be disabled and the tenant_id should come from the auth context.",
    inputSchema: { type: "object", properties: {} },
  },
];

const server = new Server(
  { name: "mcp-supabase-latam", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, unknown>;

  try {
    if (name === "kb_search") {
      const query = String(a.query ?? "");
      const tenant_id = String(a.tenant_id ?? "");
      const limit = typeof a.limit === "number" ? a.limit : 5;
      if (!query || !tenant_id) {
        return {
          isError: true,
          content: [
            { type: "text", text: "kb_search requires both 'query' and 'tenant_id'." },
          ],
        };
      }
      const hits = await kb.search({ query, tenant_id, limit });
      const formatted = hits.map((h) => ({
        id: h.doc.id,
        title: h.doc.title,
        score: Number(h.score.toFixed(4)),
        snippet: h.doc.body.slice(0, 240),
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(formatted, null, 2) }],
      };
    }

    if (name === "kb_get_document") {
      const id = String(a.id ?? "");
      const tenant_id = String(a.tenant_id ?? "");
      const doc = await kb.get({ id, tenant_id });
      return {
        content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
      };
    }

    if (name === "kb_list_tenants") {
      const tenants = await kb.listTenants();
      return {
        content: [{ type: "text", text: JSON.stringify(tenants, null, 2) }],
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
    };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error handling ${name}: ${(err as Error).message}` }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr only -- stdout is the MCP protocol channel.
console.error("[mcp-supabase-latam] connected via stdio");
