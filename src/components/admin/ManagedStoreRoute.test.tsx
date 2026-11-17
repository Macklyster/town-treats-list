import { cleanup, render, waitFor } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ManagedStoreRoute } from "./ManagedStoreRoute";

const mocks = vi.hoisted(() => ({ maybeSingle: vi.fn(), mounted: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }) },
}));
vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function Form() { mocks.mounted(); return null; }
function openRoute() {
  const rootRoute = createRootRoute();
  const couponsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin/loja/$storeId/cupons",
    component: () => (
      <ManagedStoreRoute>
        <Form />
      </ManagedStoreRoute>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([couponsRoute]),
    history: createMemoryHistory({ initialEntries: ["/admin/loja/store-id/cupons"] }),
  });
  return render(<RouterProvider router={router} />);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("managed store form access", () => {
  it("does not mount a form before the store is verified", () => {
    mocks.maybeSingle.mockReturnValue(new Promise(() => {}));
    openRoute();
    expect(mocks.mounted).not.toHaveBeenCalled();
  });
  it("does not mount forms for stores without the contracted service", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { name: "Store", managed_offers: false } });
    openRoute();
    await waitFor(() => expect(mocks.maybeSingle).toHaveBeenCalledOnce());
    expect(mocks.mounted).not.toHaveBeenCalled();
  });
  it("does not mount forms for missing stores", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });
    openRoute();
    await waitFor(() => expect(mocks.maybeSingle).toHaveBeenCalledOnce());
    expect(mocks.mounted).not.toHaveBeenCalled();
  });
  it("mounts forms for stores with the contracted service", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { name: "Store", managed_offers: true } });
    openRoute();
    await waitFor(() => expect(mocks.mounted).toHaveBeenCalled());
  });
});