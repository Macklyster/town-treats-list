import { createFileRoute } from "@tanstack/react-router";
import ColetivaForm from "@/pages/ColetivaForm";
import { ManagedStoreRoute } from "@/components/admin/ManagedStoreRoute";

export const Route = createFileRoute("/admin/loja/$storeId/coletiva/{-$id}")({
  component: () => (
    <ManagedStoreRoute>
      <ColetivaForm />
    </ManagedStoreRoute>
  ),
});
