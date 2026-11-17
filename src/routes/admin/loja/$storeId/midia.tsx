import { createFileRoute } from "@tanstack/react-router";
import Biblioteca from "@/pages/Biblioteca";
import { ManagedStoreRoute } from "@/components/admin/ManagedStoreRoute";

export const Route = createFileRoute("/admin/loja/$storeId/midia")({
  component: () => (
    <ManagedStoreRoute>
      <Biblioteca />
    </ManagedStoreRoute>
  ),
});
