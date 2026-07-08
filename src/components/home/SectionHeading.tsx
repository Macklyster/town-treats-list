import { motion } from "framer-motion";
import { ReactNode } from "react";

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
};

export const SectionHeading = ({ eyebrow, title, description, action, align = "left" }: Props) => (
  <div
    className={`mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between ${
      align === "center" ? "text-center md:text-center" : ""
    }`}
  >
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}
    >
      {eyebrow && (
        <span className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--aurora-cyan))]">
          <span className="h-1 w-6 rounded-full bg-[hsl(var(--aurora-cyan))]" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--aurora-muted))]">{description}</p>
      )}
    </motion.div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
