import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { shareOffer } from "@/lib/share-offer";
import { trackOfferEvent } from "@/lib/offer-events";
import type { UIOffer } from "@/lib/offers-api";

type Props = {
  offer: UIOffer;
  label?: string;
} & Omit<ButtonProps, "onClick" | "children">;

export const ShareOfferButton = ({
  offer,
  label = "Compartilhar nos Stories / WhatsApp",
  variant = "outline",
  size = "lg",
  className,
  ...rest
}: Props) => {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    const r = await shareOffer(offer);
    setLoading(false);
    trackOfferEvent(offer.id, "share" as any);
    if (r === "shared") return;
    if (r === "whatsapp")
      toast.success("Imagem baixada! Cole no Stories ou envie no WhatsApp.");
    else if (r === "downloaded") toast.success("Imagem da oferta baixada.");
    else if (r === "error") toast.error("Não foi possível gerar a imagem.");
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handle}
      disabled={loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
      {label}
    </Button>
  );
};
