import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export type FaqItem = { q: string; a: string };

export const FaqSection = ({
  title = "Perguntas frequentes",
  items,
}: {
  title?: string;
  items: FaqItem[];
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-highlight" /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Accordion type="single" collapsible className="w-full">
        {items.map((it, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left">{it.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground whitespace-pre-line">
              {it.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </CardContent>
  </Card>
);

export const faqToJsonLd = (items: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((it) => ({
    "@type": "Question",
    name: it.q,
    acceptedAnswer: { "@type": "Answer", text: it.a },
  })),
});
