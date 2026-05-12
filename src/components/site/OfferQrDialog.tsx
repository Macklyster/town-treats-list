import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode } from "lucide-react";
import { discountPct, formatBRL } from "@/lib/offers-api";

type OfferLike = {
  id: string;
  title: string;
  promoPrice?: number;
  promo_price?: number;
  originalPrice?: number;
  original_price?: number;
  storeSlug?: string;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  offer: OfferLike;
}

const SITE = "https://ofertasfly.com.br";

export function OfferQrDialog({ open, onOpenChange, offer }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const posterRef = useRef<HTMLDivElement>(null);

  const promo = offer.promoPrice ?? Number(offer.promo_price ?? 0);
  const original = offer.originalPrice ?? Number(offer.original_price ?? 0);
  const pct = discountPct({ originalPrice: original, promoPrice: promo });

  const url = `${SITE}/oferta/${offer.id}?src=qr${
    offer.storeSlug ? `&store=${offer.storeSlug}` : ""
  }`;

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(url, { width: 600, margin: 1, errorCorrectionLevel: "M" })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [open, url]);

  const downloadPng = async () => {
    // Render the poster onto a canvas
    const W = 800;
    const H = 1130; // ~A6 ratio
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = "#FFD400";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Brand
    ctx.fillStyle = "#0F0F0E";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("OfertasFly", W / 2, 100);

    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#666";
    ctx.fillText("OFERTA EXCLUSIVA", W / 2, 140);

    // Title (wrap)
    ctx.fillStyle = "#0F0F0E";
    ctx.font = "bold 36px sans-serif";
    const words = offer.title.split(" ");
    let line = "";
    let y = 220;
    const maxW = W - 120;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, W / 2, y);
        line = w;
        y += 46;
        if (y > 360) break;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, W / 2, y);

    // Price block
    if (pct > 0) {
      ctx.fillStyle = "#999";
      ctx.font = "26px sans-serif";
      ctx.fillText(`De ${formatBRL(original)}`, W / 2, 440);
      // strikethrough
      const m = ctx.measureText(`De ${formatBRL(original)}`);
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - m.width / 2, 433);
      ctx.lineTo(W / 2 + m.width / 2, 433);
      ctx.stroke();
    }
    ctx.fillStyle = "#E11D48";
    ctx.font = "bold 72px sans-serif";
    ctx.fillText(formatBRL(promo), W / 2, 520);
    if (pct > 0) {
      ctx.fillStyle = "#0F0F0E";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(`-${pct}% OFF`, W / 2, 562);
    }

    // QR
    if (qrDataUrl) {
      const qrImg = new Image();
      await new Promise<void>((res, rej) => {
        qrImg.onload = () => res();
        qrImg.onerror = () => rej();
        qrImg.src = qrDataUrl;
      });
      const qrSize = 380;
      ctx.drawImage(qrImg, (W - qrSize) / 2, 620, qrSize, qrSize);
    }

    // Footer
    ctx.fillStyle = "#0F0F0E";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Aponte a câmera do celular", W / 2, 1050);
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#666";
    ctx.fillText("ofertasfly.com.br", W / 2, 1085);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ofertasfly-qr-${offer.id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, "image/png");
  };

  const printPoster = () => {
    const node = posterRef.current;
    if (!node) return;
    const w = window.open("", "_blank", "width=800,height=1100");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>QR ${offer.title}</title>
      <style>
        @page { size: A6; margin: 8mm; }
        body { margin: 0; font-family: system-ui, sans-serif; }
        .poster { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px; border: 4px solid #FFD400; }
        .brand { font-size: 22px; font-weight: 800; }
        .kicker { font-size: 11px; color: #666; letter-spacing: 0.1em; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: 700; margin: 8px 0; }
        .from { font-size: 11px; color: #999; text-decoration: line-through; }
        .price { font-size: 34px; color: #E11D48; font-weight: 800; margin: 4px 0; }
        .pct { font-size: 13px; font-weight: 700; }
        img { width: 70%; max-width: 260px; margin: 12px auto; display: block; }
        .footer { font-size: 12px; font-weight: 600; margin-top: 8px; }
        .url { font-size: 10px; color: #666; }
      </style></head><body>
      <div class="poster">
        <div class="brand">OfertasFly</div>
        <div class="kicker">OFERTA EXCLUSIVA</div>
        <div class="title">${offer.title.replace(/</g, "&lt;")}</div>
        ${pct > 0 ? `<div class="from">De ${formatBRL(original)}</div>` : ""}
        <div class="price">${formatBRL(promo)}</div>
        ${pct > 0 ? `<div class="pct">-${pct}% OFF</div>` : ""}
        <img src="${qrDataUrl}" alt="QR Code"/>
        <div class="footer">Aponte a câmera do celular</div>
        <div class="url">ofertasfly.com.br</div>
      </div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> QR Code para vitrine
          </DialogTitle>
        </DialogHeader>

        <div
          ref={posterRef}
          className="mx-auto w-full max-w-xs rounded-lg border-4 border-[hsl(var(--accent))] bg-white p-4 text-center text-[#0F0F0E]"
        >
          <div className="text-xl font-extrabold">OfertasFly</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Oferta exclusiva
          </div>
          <div className="my-2 line-clamp-3 text-base font-bold">{offer.title}</div>
          {pct > 0 && (
            <div className="text-xs text-muted-foreground line-through">
              De {formatBRL(original)}
            </div>
          )}
          <div className="text-3xl font-extrabold text-[#E11D48]">{formatBRL(promo)}</div>
          {pct > 0 && <div className="text-sm font-bold">-{pct}% OFF</div>}
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR" className="mx-auto mt-3 w-44" />
          ) : (
            <div className="mx-auto mt-3 flex h-44 w-44 items-center justify-center text-xs text-muted-foreground">
              Gerando QR...
            </div>
          )}
          <div className="mt-2 text-xs font-semibold">Aponte a câmera do celular</div>
          <div className="text-[10px] text-muted-foreground">ofertasfly.com.br</div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Escaneamentos do QR são contados na sua estatística de conversão offline → online.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={printPoster} disabled={!qrDataUrl}>
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
          <Button variant="accent" onClick={downloadPng} disabled={!qrDataUrl}>
            <Download className="h-4 w-4" /> Baixar PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
