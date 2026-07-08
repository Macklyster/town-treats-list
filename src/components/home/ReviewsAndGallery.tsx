import { ReviewsCarousel } from "./ReviewsCarousel";
import { GalleryGrid } from "./GalleryGrid";

export const ReviewsAndGallery = () => (
  <section className="container py-10 md:py-14 grid gap-8 lg:grid-cols-2">
    <ReviewsCarousel />
    <GalleryGrid />
  </section>
);
