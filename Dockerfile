FROM node:22-alpine AS builder

WORKDIR /build

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
COPY scripts ./scripts
RUN npm run build


FROM node:22-alpine

LABEL org.opencontainers.image.source="https://github.com/sarteta/mcp-supabase-latam"
LABEL org.opencontainers.image.description="MCP server exposing a Supabase + pgvector knowledge base. Spanish-first, multi-tenant aware (RLS)."
LABEL org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /build/dist ./dist

USER node

# stdio transport: piped by Claude Desktop / Cursor / Claude Code.
# To run the in-memory demo KB, no env vars are needed.
ENTRYPOINT ["node", "dist/server.js"]
