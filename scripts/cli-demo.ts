#!/usr/bin/env node
/**
 * Local demo -- exercises the KB without going through the MCP stdio
 * protocol. Handy for screenshots and for a "does this actually work"
 * check before wiring into Claude Desktop.
 */
import { InMemoryKB } from "../src/kb.js";
import { SEED_DOCS } from "../src/seed.js";

const kb = new InMemoryKB(SEED_DOCS);

async function main() {
  const demos: Array<{ label: string; query: string; tenant: string }> = [
    { label: "Clinica -- horarios", query: "a que hora abren", tenant: "clinica-san-pablo" },
    {
      label: "Clinica -- cancelar",
      query: "quiero cancelar mi turno",
      tenant: "clinica-san-pablo",
    },
    {
      label: "Clinica -- obras sociales",
      query: "aceptan OSDE?",
      tenant: "clinica-san-pablo",
    },
    {
      label: "Estudio juridico -- laboral",
      query: "me despidieron, necesito ayuda",
      tenant: "estudio-jurista-ar",
    },
    {
      label: "Inmobiliaria -- requisitos",
      query: "que necesito para alquilar",
      tenant: "inmobiliaria-norte",
    },
    {
      label: "Tenant isolation -- wrong tenant no leak",
      query: "horarios de atencion",
      tenant: "inmobiliaria-norte",
    },
  ];

  console.log("mcp-supabase-latam -- local KB demo");
  console.log("=".repeat(60));
  console.log("");

  for (const d of demos) {
    console.log(`[${d.label}]`);
    console.log(`  query:  ${d.query}`);
    console.log(`  tenant: ${d.tenant}`);
    const hits = await kb.search({ query: d.query, tenant_id: d.tenant, limit: 2 });
    if (hits.length === 0) {
      console.log("  -> no hits (good -- tenant isolation is working)");
    } else {
      for (const h of hits) {
        console.log(
          `  -> [${h.score.toFixed(3)}] ${h.doc.id}  ${h.doc.title}`,
        );
      }
    }
    console.log("");
  }

  const tenants = await kb.listTenants();
  console.log(`Known tenants: ${tenants.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
