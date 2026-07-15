import { Link, useNavigate } from "react-router-dom";
import { Plus, Tag, Zap, Users, ChevronDown, Lock, Gavel, EyeOff, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type Props = {
  isPlus: boolean;
  hasActiveColetiva: boolean;
  hasActiveLeilao?: boolean;
  hasActiveInvisivel?: boolean;
};

export const NewOfferDropdown = ({ isPlus, hasActiveColetiva, hasActiveLeilao, hasActiveInvisivel }: Props) => {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="accent">
          <Plus className="h-4 w-4" /> Nova oferta
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Tipos de oferta</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate("/painel-lojista/oferta")}>
          <Tag className="mr-2 h-4 w-4 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium">Desconto / Cupom / Brinde</span>
            <span className="text-xs text-muted-foreground">Oferta padrão</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/painel-lojista/oferta?flash=1")}>
          <Zap className="mr-2 h-4 w-4 text-warning-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">Oferta Relâmpago</span>
            <span className="text-xs text-muted-foreground">Tempo limitado, contagem regressiva</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={hasActiveColetiva}
          onClick={() => {
            if (hasActiveColetiva) return;
            if (!isPlus) {
              navigate("/painel-lojista/assinatura");
              return;
            }
            navigate("/painel-lojista/coletiva");
          }}
          title={
            hasActiveColetiva
              ? "Você já tem uma coletiva ativa"
              : !isPlus
                ? "Disponível no plano Plus"
                : undefined
          }
        >
          <Users className="mr-2 h-4 w-4 text-primary" />
          <div className="flex flex-1 flex-col">
            <span className="font-medium flex items-center gap-2">
              OfertasFly Coletiva
              {!isPlus && (
                <Badge variant="secondary" className="text-[10px]">
                  <Lock className="mr-1 h-2.5 w-2.5" />
                  Plus
                </Badge>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {hasActiveColetiva
                ? "Você já tem uma ativa"
                : "X pessoas compram, todos pagam menos"}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={hasActiveLeilao}
          onClick={() => {
            if (hasActiveLeilao) return;
            if (!isPlus) { navigate("/painel-lojista/assinatura"); return; }
            navigate("/painel-lojista/leilao");
          }}
          title={hasActiveLeilao ? "Você já tem um leilão ativo" : !isPlus ? "Disponível no plano Plus" : undefined}
        >
          <Gavel className="mr-2 h-4 w-4 text-primary" />
          <div className="flex flex-1 flex-col">
            <span className="font-medium flex items-center gap-2">
              Leilão de Oferta
              {!isPlus && (
                <Badge variant="secondary" className="text-[10px]">
                  <Lock className="mr-1 h-2.5 w-2.5" />
                  Plus
                </Badge>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {hasActiveLeilao ? "Você já tem um leilão ativo" : "Preço cai com o tempo (leilão reverso)"}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={hasActiveInvisivel}
          onClick={() => {
            if (hasActiveInvisivel) return;
            if (!isPlus) { navigate("/painel-lojista/assinatura"); return; }
            navigate("/painel-lojista/oferta-invisivel");
          }}
          title={hasActiveInvisivel ? "Você já tem uma oferta invisível ativa" : !isPlus ? "Disponível no plano Plus" : undefined}
        >
          <EyeOff className="mr-2 h-4 w-4 text-primary" />
          <div className="flex flex-1 flex-col">
            <span className="font-medium flex items-center gap-2">
              Oferta Invisível
              {!isPlus && (
                <Badge variant="secondary" className="text-[10px]"><Lock className="mr-1 h-2.5 w-2.5" />Plus</Badge>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {hasActiveInvisivel ? "Você já tem uma ativa" : "Só aparece quando o cliente está perto"}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/painel-lojista/evento")}>
          <CalendarClock className="mr-2 h-4 w-4 text-primary" />
          <div className="flex flex-1 flex-col">
            <span className="font-medium">Evento</span>
            <span className="text-xs text-muted-foreground">
              Show, happy hour, feira ou experiência (Destaque/Plus)
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
