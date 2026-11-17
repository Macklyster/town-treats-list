import { createFileRoute } from "@tanstack/react-router";
import EventoForm from "@/pages/EventoForm";
import { ManagedStoreRoute } from "@/components/admin/ManagedStoreRoute";

export const Route = createFileRoute("/admin/loja/$storeId/evento/{-$id}")({
  component: () => (
    <ManagedStoreRoute>
      <EventoForm />
    </ManagedStoreRoute>
  ),
});
