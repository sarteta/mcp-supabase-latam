# mcp-supabase-latam

[![tests](https://github.com/sarteta/mcp-supabase-latam/actions/workflows/tests.yml/badge.svg)](https://github.com/sarteta/mcp-supabase-latam/actions/workflows/tests.yml)
[![node](https://img.shields.io/badge/node-22%20%7C%2023-green)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

A tiny **Model Context Protocol server** that gives Claude (Desktop,
Cursor, Claude Code) a knowledge base with **multi-tenant isolation** —
the shape you actually need when you're selling a WhatsApp/Claude bot to
a clinic, a law firm, and an inmobiliaria from the same codebase.

Ships with an **in-memory seeded KB in Spanish** so the server runs
with zero external setup. The `KnowledgeBase` interface is ~30 lines —
swap the implementation for Supabase pgvector (or anything else) when
you plug in real data.

![demo](./examples/demo.png)

## Why this exists

Most public MCP servers I've seen make two assumptions that break for
LATAM SMB work:

1. **Single-tenant.** They expose "the" knowledge base — as if every
   consumer of the MCP server is querying the same data. In practice
   a freelancer/agency running bots for 3-5 clients needs hard
   separation between their KBs, with the tenant id driven from the
   auth context (or in a demo, from a parameter).
2. **English-only.** Field descriptions, error messages, and often the
   tool docstrings are English-centric. Claude answers better when the
   tool description itself names what the data is in the target
   language — "aranceles y obras sociales" reads more naturally when
   the tool description is explicit about Spanish KBs.

This server fixes both. The tool definitions explicitly state the
tenant filter is mandatory. The seed data is Argentine Spanish with
real clinic / juridico / inmobiliaria vocabulary ("turno", "obra
social", "garantia propietaria").

## What it exposes

Three tools, all tenant-scoped:

| tool | purpose |
|------|---------|
| `kb_search` | Natural-language search over the tenant's KB. Returns ranked hits with title, snippet, score. |
| `kb_get_document` | Fetch one doc by id, tenant-scoped. Returns null if the doc doesn't exist in that tenant — never leaks another tenant's doc. |
| `kb_list_tenants` | List known tenants. Useful for demos; in production this should usually be disabled and `tenant_id` should come from auth. |

## Run the demo

```bash
npm install
npm run build
npm run demo
```

Output (abridged — full run is ~40 lines):

```
[Clinica -- obras sociales]
  query:  aceptan OSDE?
  tenant: clinica-san-pablo
  -> [0.500] cli-004  Aranceles y obras sociales

[Inmobiliaria -- requisitos]
  query:  que necesito para alquilar
  tenant: inmobiliaria-norte
  -> [0.700] rea-001  Requisitos para alquilar
  -> [0.350] rea-002  Zonas que cubrimos

[Tenant isolation]
  query:  horarios de atencion
  tenant: inmobiliaria-norte
  -> # clinic's 'Horarios de atencion' doc stays hidden — good.
```

## Wire into Claude Desktop

```bash
npm run build
```

Then in `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "supabase-latam": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-supabase-latam/dist/server.js"]
    }
  }
}
```

Restart Claude Desktop. The three tools appear in the tools list.

See [`examples/claude-desktop-config.json`](./examples/claude-desktop-config.json) for a ready-to-edit sample.

## Swap the KB for Supabase pgvector

The `KnowledgeBase` interface in [`src/kb.ts`](./src/kb.ts) is:

```ts
interface KnowledgeBase {
  search(args: { query: string; tenant_id: string; limit?: number }): Promise<SearchHit[]>;
  get(args: { id: string; tenant_id: string }): Promise<Document | null>;
  listTenants(): Promise<string[]>;
}
```

Provide a Supabase-backed implementation (pgvector embedding search,
SELECT filtered by `tenant_id` with RLS policies) and pass it into the
server instead of `InMemoryKB`. The MCP tool handlers don't change.

## Tests

12 unit tests covering:

- Search returns hits within the correct tenant only
- **Tenant isolation**: query for concept that only exists in tenant A,
  asked against tenant B, returns zero hits
- Accent-insensitive matching (`horarios` ≡ `horários`)
- Title matches outrank body-only matches
- `get()` returns null when tenant doesn't match the doc's tenant
- `listTenants` returns unique + sorted

Run them: `npm test`.

## Roadmap

- [ ] Supabase adapter reference implementation (pgvector + RLS policies + migration SQL)
- [ ] Auth-context-derived tenant id (so production usage never passes `tenant_id` as a tool argument — the arg becomes a demo-only feature)
- [ ] Batch ingestion CLI (`mcp-supabase-latam ingest <tenant_id> <dir>`)
- [ ] Portuguese seed data (`seed-pt.ts`) so the same server pattern covers BR markets

## Design notes

- **No `list_all_documents` tool.** On purpose. Any tool that enumerates
  across tenants is a tenant-isolation footgun when a prompt injection
  tricks the model into calling it.
- **Tool descriptions name the filter requirement.** Claude reads the
  description before calling; stating "filter by tenant_id — there is no
  cross-tenant mode" reduces the chance of a bad call.
- **Stderr, not stdout, for logs.** stdout is the MCP protocol channel,
  so `console.log` breaks everything. This catches a lot of contributors
  on their first MCP server — the server.ts comment calls it out.

## License

MIT © 2026 Santiago Arteta
