import { createFileRoute } from "@tanstack/react-router";
import LeilaoForm from "@/pages/LeilaoForm";
import { ManagedStoreRoute } from "@/components/admin/ManagedStoreRoute";

export const Route = createFileRoute("/admin/loja/$storeId/leilao/{-$id}")({
  component: () => (
    <ManagedStoreRoute>
      <LeilaoForm />
    </ManagedStoreRoute>
  ),
});
