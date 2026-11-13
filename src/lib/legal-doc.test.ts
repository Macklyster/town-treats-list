import { describe, it, expect } from "vitest";
import { isValidCpf, isValidCnpj, validateLegal } from "./legal-doc";
describe("legal doc", () => {
  it("cpf", () => { expect(isValidCpf("529.982.247-25")).toBe(true); expect(isValidCpf("111.111.111-11")).toBe(false); });
  it("cnpj", () => { expect(isValidCnpj("11.222.333/0001-81")).toBe(true); expect(isValidCnpj("11.222.333/0001-82")).toBe(false); });
  it("requires name", () => { expect(validateLegal("pj","11.222.333/0001-81","")).toBe("Informe a razão social"); });
});
