import { describe, expect, it } from "vitest";
import { agendaCities, businessSchema, eventSchema } from "./local-seo";
import type { PublicAgendaEvent } from "./local-seo";

const event: PublicAgendaEvent = { id: "1", slug: "feira-douradina", title: "Feira", description: null, kind: "feira", city: "Douradina", state: "PR", starts_at: "2026-11-28T18:00:00-03:00", ends_at: "2026-11-28T22:00:00-03:00", address: "Praça Central", venue: "Praça", latitude: 0, longitude: 0, cover_url: null, image_url: null, price_info: null, link_url: null, featured: false, store: null };
describe("dados locais reais", () => {
  it("identifica cidades de eventos sem depender de lojas e separa UFs", () => {
    expect(agendaCities([{ city: " Douradina ", state: "pr" }, { city: "Douradina", state: "PR" }, { city: "Douradina", state: "MS" }])).toEqual([{ city: "Douradina", state: "MS" }, { city: "Douradina", state: "PR" }]);
  });
  it("mantém datas e coordenadas reais do evento sem inventar preço ou organizador", () => {
    const schema = eventSchema(event);
    expect(schema.startDate).toBe("2026-11-28T18:00:00-03:00");
    expect(schema.location.geo?.latitude).toBe(0);
    expect(schema).not.toHaveProperty("offers");
    expect(schema).not.toHaveProperty("organizer");
  });
  it("identifica a loja correta sem fabricar avaliações", () => {
    const schema = businessSchema({ name: "Loja A", slug: "loja-a", description: null, city: "Douradina", state: "PR", address: null, phone: null, cover_url: null, logo_url: null, latitude: null, longitude: null, website: null });
    expect(schema.url).toBe("https://ofertasfly.com.br/loja/loja-a");
    expect(schema.address.addressLocality).toBe("Douradina");
    expect(schema).not.toHaveProperty("aggregateRating");
  });
});
