import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const getHeaderOffset = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--header-h").trim();
  const n = parseInt(v, 10);
  return (Number.isFinite(n) ? n : 140) + 12;
};

export const ScrollToHash = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
        window.scrollTo({ top: y, behavior: "smooth" });
      } else if (attempts < 10) {
        attempts++;
        setTimeout(tryScroll, 80);
      }
    };
    tryScroll();
  }, [pathname, hash]);

  return null;
};
