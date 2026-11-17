import { describe, it, expect } from "vitest";
import { formatSocials } from "./socials";

describe("formatSocials", () => {
  it("normaliza link do Instagram para @usuario", () => {
    expect(formatSocials({ instagram: "https://www.instagram.com/lojaexemplo/" })).toEqual(["📸 Siga: @lojaexemplo"]);
  });
  it("monta link do Facebook a partir do nome", () => {
    expect(formatSocials({ facebook: "@lojaexemplo" })).toEqual(["👍 facebook.com/lojaexemplo"]);
  });
  it("loja sem redes não gera linhas", () => {
    expect(formatSocials({ instagram: "", facebook: null })).toEqual([]);
  });
});
