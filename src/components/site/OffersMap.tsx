import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { Link } from "react-router-dom";
import { UIOffer, formatBRL } from "@/lib/offers-api";
import type { LatLng } from "@/lib/geo";
import { formatDistance } from "@/lib/geo";

// Fix default marker icons for Vite bundling
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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
    <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
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
