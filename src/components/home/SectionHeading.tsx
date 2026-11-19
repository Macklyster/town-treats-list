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
    className={`mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between ${
      align === "center" ? "text-center md:text-center" : ""
    }`}
  >
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4 }}
      className={align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}
    >
      {eyebrow && (
        <span className="mb-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-highlight">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-semibold leading-tight text-foreground md:text-[26px]">{title}</h2>
      {description && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
    </motion.div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
