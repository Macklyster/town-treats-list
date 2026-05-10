import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return setVisible(false);
      setVisible(window.scrollY / total > 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop transition-all duration-300 hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};
