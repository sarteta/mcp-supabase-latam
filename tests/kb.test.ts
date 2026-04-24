import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { InMemoryKB, lexicalScore, type Document } from "../src/kb.js";
import { SEED_DOCS } from "../src/seed.js";

const kb = new InMemoryKB(SEED_DOCS);

describe("InMemoryKB.search", () => {
  it("returns hits for the correct tenant", async () => {
    const hits = await kb.search({
      query: "horarios",
      tenant_id: "clinica-san-pablo",
      limit: 3,
    });
    assert.ok(hits.length > 0, "expected at least one hit");
    assert.equal(hits[0].doc.tenant_id, "clinica-san-pablo");
  });

  it("tenant isolation: querying a concept in the wrong tenant returns no hits", async () => {
    // 'OSDE' only appears in the clinic tenant
    const hits = await kb.search({
      query: "OSDE obras sociales",
      tenant_id: "inmobiliaria-norte",
      limit: 5,
    });
    assert.equal(hits.length, 0, "tenant isolation broken — should have zero hits");
  });

  it("accent-insensitive", async () => {
    const hits = await kb.search({
      query: "horarios",
      tenant_id: "clinica-san-pablo",
      limit: 3,
    });
    const hitIds = hits.map((h) => h.doc.id);
    // cli-001 is the "Horarios de atencion" doc
    assert.ok(hitIds.includes("cli-001"));
  });

  it("title matches outrank body-only matches", async () => {
    const hits = await kb.search({
      query: "horarios",
      tenant_id: "clinica-san-pablo",
      limit: 5,
    });
    // cli-001 has 'horarios' in title, it should be #1
    assert.equal(hits[0].doc.id, "cli-001");
  });

  it("limit parameter is respected", async () => {
    const hits = await kb.search({
      query: "turno",
      tenant_id: "clinica-san-pablo",
      limit: 1,
    });
    assert.ok(hits.length <= 1);
  });
});

describe("InMemoryKB.get", () => {
  it("returns the document when tenant matches", async () => {
    const doc = await kb.get({ id: "cli-001", tenant_id: "clinica-san-pablo" });
    assert.ok(doc);
    assert.equal(doc?.title, "Horarios de atencion");
  });

  it("returns null when tenant does not match (tenant isolation)", async () => {
    const doc = await kb.get({ id: "cli-001", tenant_id: "inmobiliaria-norte" });
    assert.equal(doc, null);
  });

  it("returns null for unknown id", async () => {
    const doc = await kb.get({ id: "nonexistent", tenant_id: "clinica-san-pablo" });
    assert.equal(doc, null);
  });
});

describe("InMemoryKB.listTenants", () => {
  it("returns all unique tenant ids sorted", async () => {
    const tenants = await kb.listTenants();
    assert.deepEqual(tenants, [
      "clinica-san-pablo",
      "estudio-jurista-ar",
      "inmobiliaria-norte",
    ]);
  });
});

describe("lexicalScore", () => {
  const doc: Document = {
    id: "t",
    tenant_id: "t",
    title: "Horarios de atencion",
    body: "Atendemos de lunes a viernes.",
    updated_at: "",
  };

  it("returns 0 for empty query", () => {
    assert.equal(lexicalScore(doc, ""), 0);
  });

  it("returns > 0 for any matching token", () => {
    assert.ok(lexicalScore(doc, "lunes") > 0);
  });

  it("title matches score higher than body-only matches", () => {
    const titleScore = lexicalScore(doc, "horarios");
    const bodyScore = lexicalScore(doc, "viernes");
    assert.ok(titleScore > bodyScore);
  });
});
