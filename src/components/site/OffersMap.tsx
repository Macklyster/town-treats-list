import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { Link } from "react-router-dom";
import { UIOffer, formatBRL } from "@/lib/offers-api";
import type { LatLng } from "@/lib/geo";
import { formatDistance } from "@/lib/geo";

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

const userIcon = L.divIcon({
  className: "user-marker",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:hsl(var(--accent));border:3px solid white;box-shadow:0 0 0 2px hsl(var(--accent)/.5);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});


type Props = {
  offers: UIOffer[];
  userLoc?: LatLng | null;
};

export const OffersMap = ({ offers, userLoc }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Group offers by store
  const groups = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; offers: UIOffer[] }>();
    for (const o of offers) {
      if (typeof o.storeLat !== "number" || typeof o.storeLng !== "number") continue;
      const key = o.storeId;
      const g = map.get(key);
      if (g) g.offers.push(o);
      else map.set(key, { lat: o.storeLat, lng: o.storeLng, offers: [o] });
    }
    return Array.from(map.values());
  }, [offers]);

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
      const marker = L.marker([g.lat, g.lng]);
      const items = g.offers
        .slice(0, 5)
        .map(
          (o) => `
          <a href="/oferta/${o.id}" style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #eee;text-decoration:none;color:inherit;">
            <img src="${o.image}" alt="" style="width:48px;height:48px;border-radius:6px;object-fit:cover;" />
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:13px;line-height:1.2;color:#111;">${escape(o.title)}</div>
              <div style="font-size:12px;color:hsl(var(--accent-strong, 25 95% 45%));font-weight:700;">${formatBRL(o.promoPrice)}</div>
            </div>
          </a>`,
        )
        .join("");
      const more =
        g.offers.length > 5
          ? `<div style="font-size:11px;color:#666;padding-top:6px;">+${g.offers.length - 5} ofertas</div>`
          : "";
      const html = `
        <div style="min-width:220px;max-width:260px;font-family:inherit;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#666;margin-bottom:4px;">${escape(g.offers[0].storeName)}</div>
          ${items}${more}
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
