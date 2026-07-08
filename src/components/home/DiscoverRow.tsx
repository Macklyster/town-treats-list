import { NearbyMap } from "./NearbyMap";
import { Recommended } from "./Recommended";

export const DiscoverRow = () => (
  <section className="container py-10 md:py-14 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
    <NearbyMap />
    <Recommended />
  </section>
);
