import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MediaLibrary } from "./MediaLibrary";
import { ImageIcon } from "lucide-react";

type Props = {
  storeId: string;
  selected: string[];
  coverId?: string;
  onChange: (selected: string[], coverId: string) => void;
  trigger?: React.ReactNode;
};

export function MediaPicker({ storeId, selected, coverId, onChange, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const [draftCover, setDraftCover] = useState<string | undefined>(coverId);

  const openDialog = (v: boolean) => {
    if (v) {
      setDraft(selected);
      setDraftCover(coverId);
    }
    setOpen(v);
  };

  const toggle = (id: string) => {
    setDraft((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      if (exists && draftCover === id) setDraftCover(next[0]);
      if (!exists && !draftCover) setDraftCover(id);
      return next;
    });
  };

  const setCover = (id: string) => {
    if (!draft.includes(id)) setDraft((prev) => [...prev, id]);
    setDraftCover(id);
  };

  const confirm = () => {
    onChange(draft, draftCover ?? draft[0] ?? "");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={openDialog}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline">
            <ImageIcon className="mr-2 h-4 w-4" /> Escolher da biblioteca
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Biblioteca de mídia</DialogTitle>
        </DialogHeader>
        <MediaLibrary
          storeId={storeId}
          selectable
          selected={draft}
          coverId={draftCover}
          onToggle={toggle}
          onSetCover={setCover}
        />
        <DialogFooter>
          <span className="mr-auto text-sm text-muted-foreground">
            {draft.length} selecionada(s){draftCover ? " · capa definida" : ""}
          </span>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={confirm} disabled={draft.length === 0}>Usar seleção</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
