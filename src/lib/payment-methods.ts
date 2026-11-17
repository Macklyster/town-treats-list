import { Banknote, CreditCard, QrCode, Receipt, UtensilsCrossed, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PaymentMethodId =
  | "pix"
  | "credito"
  | "debito"
  | "dinheiro"
  | "boleto"
  | "vale";

export const PAYMENT_METHODS: { id: PaymentMethodId; label: string; icon: LucideIcon }[] = [
  { id: "pix", label: "PIX", icon: QrCode },
  { id: "credito", label: "Cartão de Crédito", icon: CreditCard },
  { id: "debito", label: "Cartão de Débito", icon: Wallet },
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "boleto", label: "Boleto", icon: Receipt },
  { id: "vale", label: "Vale Alimentação/Refeição", icon: UtensilsCrossed },
];

const TAG = /^\[pgto:([a-z,]+)\]\s*\n?\n?/i;

export function parseConditions(raw: string): { methods: PaymentMethodId[]; text: string } {
  if (!raw) return { methods: [], text: "" };
  const m = raw.match(TAG);
  if (!m) return { methods: [], text: raw };
  const ids = (m[1] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is PaymentMethodId => PAYMENT_METHODS.some((p) => p.id === s));
  return { methods: ids, text: raw.replace(TAG, "").trim() };
}

export function buildConditions(methods: PaymentMethodId[], text: string): string {
  const cleanText = text.trim();
  if (methods.length === 0) return cleanText;
  return `[pgto:${methods.join(",")}]${cleanText ? "\n\n" + cleanText : ""}`;
}

export function getMethod(id: string) {
  return PAYMENT_METHODS.find((p) => p.id === id);
}
