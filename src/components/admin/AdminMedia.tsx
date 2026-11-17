import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaLibrary } from "@/components/cms/MediaLibrary";

export function AdminMedia() {
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("stores")
      .select("id,name")
      .order("name", { ascending: true })
      .then(({ data }) => {
        setStores((data ?? []) as any);
        if (data?.[0]) setStoreId(data[0].id);
      });
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Biblioteca de Mídia</CardTitle>
        <Select value={storeId ?? undefined} onValueChange={setStoreId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Selecione uma loja" /></SelectTrigger>
          <SelectContent className="max-h-80">
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {storeId ? <MediaLibrary storeId={storeId} /> : <p className="text-muted-foreground">Selecione uma loja.</p>}
      </CardContent>
    </Card>
  );
}
