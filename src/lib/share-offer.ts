import { UIOffer, discountPct, formatBRL } from "@/lib/offers-api";

const W = 1080;
const H = 1920;
const BRAND = "OfertasFly";
const SITE = "ofertasfly.com.br";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1] ?? "";
    while (ctx.measureText(last + "…").width > maxWidth && last.length > 0) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last + "…";
  }
  return lines;
};

const roundedImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.clip();
  // cover fit
  const ar = img.width / img.height;
  const tar = w / h;
  let dw = w,
    dh = h,
    dx = x,
    dy = y;
  if (ar > tar) {
    dh = h;
    dw = h * ar;
    dx = x - (dw - w) / 2;
  } else {
    dw = w;
    dh = w / ar;
    dy = y - (dh - h) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
};

export const buildOfferShareImage = async (offer: UIOffer): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0F0F0E");
  bg.addColorStop(1, "#1A1A18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // header brand
  ctx.fillStyle = "#FFD400";
  ctx.font = "800 56px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(BRAND, 80, 100);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 30px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText("Ofertas locais perto de você", 80, 170);

  // Offer image
  const imgX = 80;
  const imgY = 260;
  const imgW = W - 160;
  const imgH = 920;
  ctx.fillStyle = "#222";
  ctx.fillRect(imgX, imgY, imgW, imgH);
  try {
    const img = await loadImage(offer.image);
    roundedImage(ctx, img, imgX, imgY, imgW, imgH, 32);
  } catch {
    ctx.fillStyle = "#333";
    ctx.fillRect(imgX, imgY, imgW, imgH);
  }

  // discount badge
  const pct = discountPct(offer);
  if (pct > 0) {
    ctx.save();
    const bx = imgX + 24;
    const by = imgY + 24;
    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    const rw = 200,
      rh = 80,
      rr = 40;
    ctx.moveTo(bx + rr, by);
    ctx.arcTo(bx + rw, by, bx + rw, by + rh, rr);
    ctx.arcTo(bx + rw, by + rh, bx, by + rh, rr);
    ctx.arcTo(bx, by + rh, bx, by, rr);
    ctx.arcTo(bx, by, bx + rw, by, rr);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 44px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`-${pct}%`, bx + rw / 2, by + rh / 2 + 2);
    ctx.restore();
  }

  // Flash badge
  if (offer.isFlash) {
    ctx.save();
    const bx = imgX + imgW - 24 - 280;
    const by = imgY + 24;
    ctx.fillStyle = "#FFD400";
    const rw = 280,
      rh = 80,
      rr = 40;
    ctx.beginPath();
    ctx.moveTo(bx + rr, by);
    ctx.arcTo(bx + rw, by, bx + rw, by + rh, rr);
    ctx.arcTo(bx + rw, by + rh, bx, by + rh, rr);
    ctx.arcTo(bx, by + rh, bx, by, rr);
    ctx.arcTo(bx, by, bx + rw, by, rr);
    ctx.fill();
    ctx.fillStyle = "#0F0F0E";
    ctx.font = "900 38px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡ RELÂMPAGO", bx + rw / 2, by + rh / 2 + 2);
    ctx.restore();
  }

  // Title
  ctx.fillStyle = "#fff";
  ctx.font = "700 56px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const titleLines = wrapText(ctx, offer.title, W - 160, 2);
  let ty = imgY + imgH + 50;
  titleLines.forEach((l) => {
    ctx.fillText(l, 80, ty);
    ty += 64;
  });

  // Store
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "500 32px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText(offer.storeName, 80, ty + 10);
  ty += 60;

  // Prices
  ty += 30;
  if (pct > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "500 36px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    const orig = formatBRL(offer.originalPrice);
    ctx.fillText(orig, 80, ty + 30);
    const w = ctx.measureText(orig).width;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, ty + 50);
    ctx.lineTo(80 + w, ty + 50);
    ctx.stroke();
  }
  ctx.fillStyle = "#FFD400";
  ctx.font = "900 96px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText(formatBRL(offer.promoPrice), 80, ty + 70);

  // Watermark footer
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Veja em ${SITE}`, W / 2, H - 70);

  return await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("blob"))), "image/png", 0.95),
  );
};

const offerUrl = (offer: UIOffer) =>
  `${window.location.origin}/oferta/${offer.id}`;

const buildShareText = (offer: UIOffer) => {
  const pct = discountPct(offer);
  const head = pct > 0 ? `🔥 ${pct}% OFF` : "🔥 Oferta";
  return `${head} • ${offer.title}\n${formatBRL(offer.promoPrice)} na ${offer.storeName}\n${offerUrl(offer)}`;
};

export const shareOffer = async (
  offer: UIOffer,
): Promise<"shared" | "downloaded" | "whatsapp" | "error"> => {
  let blob: Blob;
  try {
    blob = await buildOfferShareImage(offer);
  } catch (e) {
    console.error("share image build failed", e);
    return "error";
  }
  const file = new File([blob], `oferta-${offer.id}.png`, { type: "image/png" });
  const text = buildShareText(offer);

  // Try Web Share API with file
  const nav = navigator as any;
  if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({
        files: [file],
        title: offer.title,
        text,
      });
      return "shared";
    } catch (err: any) {
      if (err?.name === "AbortError") return "shared";
    }
  }

  // Fallback: download image + open WhatsApp share link
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4_000);
  } catch (e) {
    console.error("download failed", e);
  }
  try {
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
    return "whatsapp";
  } catch {
    return "downloaded";
  }
};
