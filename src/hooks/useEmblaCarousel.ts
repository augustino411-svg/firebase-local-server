import { useEmblaCarousel } from 'embla-carousel-react';

export function useEmbla(options?: Parameters<typeof useEmblaCarousel>[0]) {
  const [viewportRef, emblaApi] = useEmblaCarousel(options);
  return [viewportRef, emblaApi] as const;
}
