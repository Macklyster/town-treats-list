import { useParams } from "react-router-dom";

/**
 * When a form is opened under /admin/loja/:storeId/..., the admin is creating
 * content on behalf of a store that contracted the "Gestão de Ofertas" service.
 */
export function useManagedStore() {
  const { storeId } = useParams();
  const managedStoreId = storeId ?? null;
  return {
    managedStoreId,
    base: managedStoreId ? `/admin/loja/${managedStoreId}` : "/painel-lojista",
    back: managedStoreId ? `/admin?tab=gerenciadas&store=${managedStoreId}` : "/painel-lojista",
    adminExtra: managedStoreId ? { created_by_admin: true, status: "approved" as const } : {},
  };
}
