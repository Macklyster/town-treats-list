import { supabase } from "@/integrations/supabase/client";

export type PixKeyType = "cnpj" | "cpf" | "phone" | "email" | "evp";

export interface StorePix {
  store_id: string;
  key_type: PixKeyType;
  pix_key: string;
  holder_name: string;
  holder_city: string;
  bank_name: string | null;
}

export const PIX_KEY_LABELS: Record<PixKeyType, string> = {
  cnpj: "CNPJ",
  cpf: "CPF",
  phone: "Celular",
  email: "E-mail",
  evp: "Chave aleatória",
};

const digits = (s: string) => s.replace(/\D/g, "");

/** Normaliza a chave para o formato exigido pelo BR Code. Retorna null se inválida. */
export function normalizePixKey(type: PixKeyType, raw: string): string | null {
  const v = raw.trim();
  switch (type) {
    case "cpf":
      return digits(v).length === 11 ? digits(v) : null;
    case "cnpj":
      return digits(v).length === 14 ? digits(v) : null;
    case "phone": {
      let d = digits(v);
      if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
      return d.length === 10 || d.length === 11 ? `+55${d}` : null;
    }
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 77 ? v.toLowerCase() : null;
    case "evp":
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v.toLowerCase() : null;
  }
}

/** Remove acentos e caracteres fora do padrão EMV. */
function clean(s: string, max: number) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, max);
}

const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Gera o código "Pix Copia e Cola" (BR Code estático) seguindo o padrão do Banco Central. */
export function buildPixPayload(opts: {
  key: string;
  name: string;
  city: string;
  amount?: number;
  txid?: string;
}): string {
  const txid = (opts.txid ?? "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const mai = field("00", "br.gov.bcb.pix") + field("01", opts.key);
  let p =
    field("00", "01") +
    field("26", mai) +
    field("52", "0000") +
    field("53", "986");
  if (opts.amount && opts.amount > 0) p += field("54", opts.amount.toFixed(2));
  p +=
    field("58", "BR") +
    field("59", clean(opts.name, 25) || "LOJA") +
    field("60", clean(opts.city, 15) || "BRASIL") +
    field("62", field("05", txid)) +
    "6304";
  return p + crc16(p);
}

export async function fetchStorePix(storeId: string): Promise<StorePix | null> {
  const { data } = await supabase.from("store_pix_keys").select("*").eq("store_id", storeId).maybeSingle();
  return (data as StorePix | null) ?? null;
}
