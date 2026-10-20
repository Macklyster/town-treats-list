import { beforeEach, describe, expect, it, vi } from "vitest";
import { setOfferMedia } from "./media-api";

// Simula o banco, incluindo o índice único parcial uniq_offer_media_cover:
// no máximo uma linha com is_cover = true por oferta.
const db = vi.hoisted(() => ({
  offerMedia: [] as { offer_id: string; media_id: string; position: number; is_cover: boolean }[],
  assets: new Map<string, { id: string; url: string; media_type: string }>(),
}));

vi.mock("@/integrations/supabase/client", () => {
  const ok = (data: any = null) => ({ data, error: null });
  const thenable = (result: any) => ({ then: (res: any) => Promise.resolve(result).then(res) });

  function offerMediaTable() {
    return {
      update: (patch: any) => ({
        eq: (_k: string, offerId: string) => ({
          eq: (_k2: string, isCover: boolean) => {
            db.offerMedia.forEach((r) => {
              if (r.offer_id === offerId && r.is_cover === isCover) Object.assign(r, patch);
            });
            return thenable(ok());
          },
        }),
      }),
      upsert: (rows: any[]) => {
        for (const row of rows) {
          if (row.is_cover) {
            const otherCover = db.offerMedia.find(
              (r) => r.offer_id === row.offer_id && r.is_cover && r.media_id !== row.media_id,
            );
            if (otherCover) {
              return thenable({
                data: null,
                error: { message: 'duplicate key value violates unique constraint "uniq_offer_media_cover"' },
              });
            }
          }
          const existing = db.offerMedia.find(
            (r) => r.offer_id === row.offer_id && r.media_id === row.media_id,
          );
          if (existing) Object.assign(existing, row);
          else db.offerMedia.push({ ...row });
        }
        return thenable(ok());
      },
      delete: () => ({
        eq: (_k: string, offerId: string) => {
          const finish = () => thenable(ok());
          const exec = (keepIds?: string[]) => {
            for (let i = db.offerMedia.length - 1; i >= 0; i--) {
              const r = db.offerMedia[i];
              if (r.offer_id === offerId && (!keepIds || !keepIds.includes(r.media_id))) {
                db.offerMedia.splice(i, 1);
              }
            }
          };
          return {
            not: (_k2: string, _op: string, list: string) => {
              const keepIds = list.replace(/[()]/g, "").split(",").filter(Boolean);
              exec(keepIds);
              return finish();
            },
            then: (res: any) => {
              exec();
              return Promise.resolve(ok()).then(res);
            },
          };
        },
      }),
      select: () => ({
        eq: (_k: string, offerId: string) =>
          thenable(ok(db.offerMedia.filter((r) => r.offer_id === offerId).map((r) => ({ media_id: r.media_id })))),
      }),
    };
  }

  return {
    supabase: {
      from: (table: string) => {
        if (table === "offer_media") return offerMediaTable();
        if (table === "media_assets") {
          return {
            select: () => ({
              in: (_k: string, ids: string[]) =>
                thenable(ok(ids.map((id) => db.assets.get(id)).filter(Boolean))),
            }),
          };
        }
        // offers (atualização da image_url)
        return { update: () => ({ eq: () => thenable(ok()) }) };
      },
    },
  };
});

const OFFER = "offer-1";
const img = (id: string) => ({ id, url: `https://cdn/${id}.webp`, media_type: "image" });

beforeEach(() => {
  db.offerMedia.length = 0;
  db.assets.clear();
  ["a", "b", "c"].forEach((id) => db.assets.set(id, img(id)));
});

describe("setOfferMedia", () => {
  it("troca a capa de uma oferta que já tem mídias sem violar a regra de capa única", async () => {
    db.offerMedia.push(
      { offer_id: OFFER, media_id: "a", position: 0, is_cover: true },
      { offer_id: OFFER, media_id: "b", position: 1, is_cover: false },
    );

    await setOfferMedia(OFFER, ["a", "b"], "b");

    const covers = db.offerMedia.filter((r) => r.offer_id === OFFER && r.is_cover);
    expect(covers).toHaveLength(1);
    expect(covers[0].media_id).toBe("b");
  });

  it("define como capa uma mídia recém-adicionada a uma oferta que já tem capa", async () => {
    db.offerMedia.push({ offer_id: OFFER, media_id: "a", position: 0, is_cover: true });

    await setOfferMedia(OFFER, ["a", "c"], "c");

    const covers = db.offerMedia.filter((r) => r.offer_id === OFFER && r.is_cover);
    expect(covers).toHaveLength(1);
    expect(covers[0].media_id).toBe("c");
  });
});
