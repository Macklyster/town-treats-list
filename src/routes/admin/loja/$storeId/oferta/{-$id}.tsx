import { createFileRoute } from "@tanstack/react-router";
import OfertaForm from "@/pages/OfertaForm";
import { ManagedStoreRoute } from "@/components/admin/ManagedStoreRoute";

export const Route = createFileRoute("/admin/loja/$storeId/oferta/{-$id}")({
  component: () => (
    <ManagedStoreRoute>
      <OfertaForm />
    </ManagedStoreRoute>
  ),
});
