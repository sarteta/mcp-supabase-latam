/**
 * In-memory knowledge base with a cheap lexical scorer.
 *
 * Swap this out for a Supabase pgvector query when you plug in your own
 * data — the KnowledgeBase interface is narrow on purpose.
 *
 * Multi-tenant: every doc has a tenant_id. Searches MUST filter by
 * tenant_id, which is how RLS would enforce this in Supabase.
 */

export interface Document {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  source_url?: string;
  updated_at: string; // ISO
}

export interface SearchHit {
  doc: Document;
  score: number;
}

export interface KnowledgeBase {
  search(args: { query: string; tenant_id: string; limit?: number }): Promise<SearchHit[]>;
  get(args: { id: string; tenant_id: string }): Promise<Document | null>;
  listTenants(): Promise<string[]>;
}

/** Normalize for scoring: lowercase, strip non-word, collapse whitespace. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

/**
 * Score a doc against a query using a simple token-overlap heuristic.
 * Returns 0..1. Real implementations should replace this with cosine
 * similarity over real embeddings.
 */
export function lexicalScore(doc: Document, query: string): number {
  const qtokens = new Set(tokenize(query));
  if (qtokens.size === 0) return 0;

  const haystack = normalize(doc.title + " " + doc.body);
  const htokens = tokenize(haystack);
  const hset = new Set(htokens);

  let overlap = 0;
  for (const t of qtokens) if (hset.has(t)) overlap += 1;

  const recall = overlap / qtokens.size;

  // Title boost: matches in title get extra weight
  const titleTokens = new Set(tokenize(doc.title));
  let titleBoost = 0;
  for (const t of qtokens) if (titleTokens.has(t)) titleBoost += 0.1;

  // Intentionally uncapped: title matches should sort strictly above
  // body-only matches with the same recall. Scores above 1.0 are fine —
  // search() sorts descending, that's all that matters.
  return recall + titleBoost;
}

export class InMemoryKB implements KnowledgeBase {
  constructor(private docs: Document[]) {}

  async search({
    query,
    tenant_id,
    limit = 5,
  }: {
    query: string;
    tenant_id: string;
    limit?: number;
  }): Promise<SearchHit[]> {
    const scored = this.docs
      .filter((d) => d.tenant_id === tenant_id)
      .map((doc) => ({ doc, score: lexicalScore(doc, query) }))
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return scored;
  }

  async get({ id, tenant_id }: { id: string; tenant_id: string }): Promise<Document | null> {
    return this.docs.find((d) => d.id === id && d.tenant_id === tenant_id) ?? null;
  }

  async listTenants(): Promise<string[]> {
    return Array.from(new Set(this.docs.map((d) => d.tenant_id))).sort();
  }
}
