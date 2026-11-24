import { queryOptions } from "@tanstack/react-query";
import { loadLocalSeo } from "@/lib/local-seo.functions";

export const agendaQuery = queryOptions({ queryKey: ["public-city-agenda"], queryFn: () => loadLocalSeo({ data: { type: "agenda" } }), staleTime: 60_000 });
