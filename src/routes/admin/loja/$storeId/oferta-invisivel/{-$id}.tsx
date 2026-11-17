import { createFileRoute } from "@tanstack/react-router";
import OfertaInvisivelForm from "@/pages/OfertaInvisivelForm";
import { ManagedStoreRoute } from "@/components/admin/ManagedStoreRoute";

export const Route = createFileRoute("/admin/loja/$storeId/oferta-invisivel/{-$id}")({
  component: () => (
    <ManagedStoreRoute>
      <OfertaInvisivelForm />
    </ManagedStoreRoute>
  ),
});
