export type CategoryKey = "food" | "beauty" | "health" | "fashion" | "pet" | "service";

export const categoryTheme: Record<CategoryKey, { bg: string; badgeBg: string; badgeText: string }> = {
  food:    { bg: "bg-[hsl(var(--cat-food-bg))]",    badgeBg: "bg-[hsl(var(--cat-food-badge))]",    badgeText: "text-[hsl(var(--cat-food-text))]" },
  beauty:  { bg: "bg-[hsl(var(--cat-beauty-bg))]",  badgeBg: "bg-[hsl(var(--cat-beauty-badge))]",  badgeText: "text-[hsl(var(--cat-beauty-text))]" },
  health:  { bg: "bg-[hsl(var(--cat-health-bg))]",  badgeBg: "bg-[hsl(var(--cat-health-badge))]",  badgeText: "text-[hsl(var(--cat-health-text))]" },
  fashion: { bg: "bg-[hsl(var(--cat-fashion-bg))]", badgeBg: "bg-[hsl(var(--cat-fashion-badge))]", badgeText: "text-[hsl(var(--cat-fashion-text))]" },
  pet:     { bg: "bg-[hsl(var(--cat-pet-bg))]",     badgeBg: "bg-[hsl(var(--cat-pet-badge))]",     badgeText: "text-[hsl(var(--cat-pet-text))]" },
  service: { bg: "bg-[hsl(var(--cat-service-bg))]", badgeBg: "bg-[hsl(var(--cat-service-badge))]", badgeText: "text-[hsl(var(--cat-service-text))]" },
};

export const fallbackCategoryTheme = categoryTheme.service;
