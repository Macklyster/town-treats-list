import { createFileRoute } from "@tanstack/react-router";
import Cupons from "@/pages/Cupons";
import { ManagedStoreRoute } from "@/components/admin/ManagedStoreRoute";

export const Route = createFileRoute("/admin/loja/$storeId/cupons")({
  component: () => (
    <ManagedStoreRoute>
      <Cupons />
    </ManagedStoreRoute>
  ),
});
