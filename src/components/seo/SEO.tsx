import { useEffect } from "react";
import { absoluteUrl } from "@/lib/slug";
import { DEFAULT_SHARE_IMAGE, clampDescription, clampTitle } from "@/lib/route-seo";

type SEOProps = {
  title: string;
  description: string;
  path: string;
  image?: string | null | undefined;
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
};

const upsertMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/**
 * Client-side head updates for pages after hydration and client navigation.
 * Crawlers get server-rendered tags from each route's head(); this keeps the
 * browser tab and in-app metadata in sync with data loaded on the page.
 */
export const SEO = ({ title, description, path, image, noindex, jsonLd }: SEOProps) => {
  const ldKey = JSON.stringify(jsonLd ?? null);
  useEffect(() => {
    const t = clampTitle(title);
    const d = clampDescription(description);
    const url = absoluteUrl(path);
    const img = image || DEFAULT_SHARE_IMAGE;
    document.title = t;
    upsertMeta("name", "description", d);
    upsertMeta("property", "og:title", t);
    upsertMeta("property", "og:description", d);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", img);
    upsertMeta("name", "twitter:title", t);
    upsertMeta("name", "twitter:description", d);
    upsertMeta("name", "twitter:image", img);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    const robots = document.head.querySelector('meta[name="robots"][data-seo]');
    if (noindex && !robots) {
      const el = document.createElement("meta");
      el.name = "robots";
      el.content = "noindex,nofollow";
      el.dataset["seo"] = "1";
      document.head.appendChild(el);
    } else if (!noindex) robots?.remove();
  }, [title, description, path, image, noindex]);

  useEffect(() => {
    const list = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    const nodes = list.map((obj) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.dataset["seo"] = "1";
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
      return s;
    });
    return () => nodes.forEach((n) => n.remove());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ldKey]);

  return null;
};
