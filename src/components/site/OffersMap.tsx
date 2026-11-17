import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import type { MapPinItem } from "@/lib/map-items";
import type { LatLng } from "@/lib/geo";

// Primary-colored pin (uses design token --primary)
const primaryPinIcon = L.divIcon({
  className: "offer-pin",
  html: `
    <div style="position:relative;width:28px;height:38px;">
      <svg viewBox="0 0 28 38" width="28" height="38" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">
        <path d="M14 0C6.27 0 0 6.05 0 13.5 0 23.5 14 38 14 38s14-14.5 14-24.5C28 6.05 21.73 0 14 0z" fill="hsl(var(--primary))"/>
        <circle cx="14" cy="13.5" r="5" fill="white"/>
      </svg>
    </div>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -32],
});

const eventPinIcon = L.divIcon({
  className: "event-pin",
  html: `
    <div style="position:relative;width:28px;height:38px;">
      <svg viewBox="0 0 28 38" width="28" height="38" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">
        <path d="M14 0C6.27 0 0 6.05 0 13.5 0 23.5 14 38 14 38s14-14.5 14-24.5C28 6.05 21.73 0 14 0z" fill="hsl(var(--accent))"/>
        <circle cx="14" cy="13.5" r="5" fill="white"/>
      </svg>
    </div>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -32],
});

const userIcon = L.divIcon({
  className: "user-marker",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:hsl(var(--accent));border:3px solid white;box-shadow:0 0 0 2px hsl(var(--accent)/.5);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});


type Props = {
  items: MapPinItem[];
  userLoc?: LatLng | null;
};

export const OffersMap = ({ items, userLoc }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Group items by store
  const groups = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; items: MapPinItem[] }>();
    for (const item of items) {
      if (typeof item.storeLat !== "number" || typeof item.storeLng !== "number") continue;
      const key = item.storeId;
      const g = map.get(key);
      if (g) g.items.push(item);
      else map.set(key, { lat: item.storeLat, lng: item.storeLng, items: [item] });
    }
    return Array.from(map.values());
  }, [items]);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-14.235, -51.925],
      zoom: 4,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // refresh markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const points: L.LatLngExpression[] = [];

    for (const g of groups) {
      const hasEvent = g.items.some((i) => i.kind === "event");
      const marker = L.marker([g.lat, g.lng], { icon: hasEvent ? eventPinIcon : primaryPinIcon });

      const itemsHtml = g.items
        .slice(0, 5)
        .map((item) => {
          const badge = item.badge
            ? `<span style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:9999px;background:hsl(var(--hot));color:hsl(var(--hot-foreground));font-size:10px;font-weight:700;">${escape(item.badge)}</span>`
            : "";
          const meta = [item.kindLabel, item.dateLabel].filter(Boolean).join(" · ");
          return `
          <a href="${item.link}" style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #eee;text-decoration:none;color:inherit;">
            <img src="${item.image}" alt="" style="width:48px;height:48px;border-radius:6px;object-fit:cover;" />
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:13px;line-height:1.2;color:#111;">${escape(item.title)}${badge}</div>
              ${meta ? `<div style="font-size:11px;color:#666;margin-top:2px;">${escape(meta)}</div>` : ""}
              ${item.priceLabel ? `<div style="font-size:12px;color:hsl(var(--accent-strong, 25 95% 45%));font-weight:700;">${escape(item.priceLabel)}</div>` : ""}
            </div>
          </a>`;
        })
        .join("");
      const more =
        g.items.length > 5
          ? `<div style="font-size:11px;color:#666;padding-top:6px;">+${g.items.length - 5} itens</div>`
          : "";
      const html = `
        <div style="min-width:220px;max-width:260px;font-family:inherit;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#666;margin-bottom:4px;">${escape(g.items[0]?.storeName ?? "")}</div>
          ${itemsHtml}${more}
        </div>`;
      marker.bindPopup(html);
      marker.addTo(layer);
      points.push([g.lat, g.lng]);
    }

    if (userLoc) {
      L.marker([userLoc.lat, userLoc.lng], { icon: userIcon })
        .bindPopup("Você está aqui")
        .addTo(layer);
      points.push([userLoc.lat, userLoc.lng]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
    setTimeout(() => map.invalidateSize(), 100);
  }, [groups, userLoc?.lat, userLoc?.lng]);

  return (
    <div className="offers-map-container isolate z-0 overflow-hidden rounded-2xl border border-border shadow-soft">
      <div ref={containerRef} style={{ height: 360, width: "100%" }} />
    </div>
  );
};

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default OffersMap;
