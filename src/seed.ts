import type { Document } from "./kb.js";

/**
 * Seeded demo data -- three tenants (clinic, law firm, real estate) with
 * a handful of Spanish-language documents each. Enough to exercise
 * tenant isolation and RAG-style retrieval without any external service.
 */
export const SEED_DOCS: Document[] = [
  // Tenant: clinica-san-pablo
  {
    id: "cli-001",
    tenant_id: "clinica-san-pablo",
    title: "Horarios de atencion",
    body: "Atendemos de lunes a viernes de 9 a 18 hs. Sabados de 9 a 13 hs. Domingos y feriados cerrado.",
    updated_at: "2026-04-01T10:00:00Z",
  },
  {
    id: "cli-002",
    tenant_id: "clinica-san-pablo",
    title: "Como reservar un turno",
    body: "Podes reservar turno desde www.clinicasanpablo.com o respondiendo un WhatsApp con tu DNI y la especialidad que necesitas.",
    updated_at: "2026-04-02T10:00:00Z",
  },
  {
    id: "cli-003",
    tenant_id: "clinica-san-pablo",
    title: "Cancelacion de turnos",
    body: "Para cancelar escribi CANCELAR seguido de tu DNI. Cancelaciones con menos de 24 hs de anticipacion tienen cargo administrativo.",
    updated_at: "2026-04-03T10:00:00Z",
  },
  {
    id: "cli-004",
    tenant_id: "clinica-san-pablo",
    title: "Aranceles y obras sociales",
    body: "Trabajamos con OSDE, Galeno, Swiss Medical, Medife y PAMI. Consultas particulares con arancel diferenciado segun especialidad.",
    updated_at: "2026-04-04T10:00:00Z",
  },
  {
    id: "cli-005",
    tenant_id: "clinica-san-pablo",
    title: "Estudios y estudios especiales",
    body: "Ofrecemos laboratorio, ecografia, electrocardiograma y radiologia. Los estudios se entregan en 24-48 hs por mail.",
    updated_at: "2026-04-05T10:00:00Z",
  },

  // Tenant: estudio-jurista-ar
  {
    id: "leg-001",
    tenant_id: "estudio-jurista-ar",
    title: "Consulta gratuita inicial",
    body: "La primera consulta es gratuita y sin compromiso. Dura 20 minutos y la hacemos por videollamada o presencial.",
    updated_at: "2026-04-01T10:00:00Z",
  },
  {
    id: "leg-002",
    tenant_id: "estudio-jurista-ar",
    title: "Especialidades",
    body: "Derecho laboral (despidos, ART, indemnizaciones), familiar (divorcios, cuota alimentaria), sucesiones y contratos comerciales.",
    updated_at: "2026-04-02T10:00:00Z",
  },
  {
    id: "leg-003",
    tenant_id: "estudio-jurista-ar",
    title: "Honorarios",
    body: "Cobramos por acto procesal o como porcentaje del resultado segun el caso. En la consulta inicial te damos un rango claro antes de cualquier compromiso.",
    updated_at: "2026-04-03T10:00:00Z",
  },

  // Tenant: inmobiliaria-norte
  {
    id: "rea-001",
    tenant_id: "inmobiliaria-norte",
    title: "Requisitos para alquilar",
    body: "Necesitas recibo de sueldo o monotributo de los ultimos 3 meses, garantia propietaria o seguro de caucion, y DNI.",
    updated_at: "2026-04-01T10:00:00Z",
  },
  {
    id: "rea-002",
    tenant_id: "inmobiliaria-norte",
    title: "Zonas que cubrimos",
    body: "Cordoba Capital, Villa Carlos Paz, Villa Allende, Unquillo y Rio Ceballos. Publicamos propiedades en Mercado Libre y Zonaprop.",
    updated_at: "2026-04-02T10:00:00Z",
  },
  {
    id: "rea-003",
    tenant_id: "inmobiliaria-norte",
    title: "Comision de alquiler",
    body: "La comision de alquiler es el 5% del total del contrato, se paga al momento de la firma. El deposito son dos meses.",
    updated_at: "2026-04-03T10:00:00Z",
  },
];
