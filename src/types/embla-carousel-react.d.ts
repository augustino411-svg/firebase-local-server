declare module 'embla-carousel-react' {
  import * as React from 'react'

  export type EmblaOptionsType = {
    loop?: boolean
    align?: 'start' | 'center' | 'end'
    skipSnaps?: boolean
    draggable?: boolean
    speed?: number
    startIndex?: number
    containScroll?: 'trimSnaps' | ''
    // 可依需求擴充
  }

  export type UseEmblaCarouselType = [
    React.RefCallback<HTMLDivElement>,
    EmblaCarouselType | undefined
  ]

  export function useEmblaCarousel(
    options?: EmblaOptionsType
  ): UseEmblaCarouselType

  export type EmblaEventType =
    | 'select'
    | 'init'
    | 'reInit'
    | 'destroy'
    | 'pointerDown'
    | 'pointerUp'
    | 'scroll'

  export interface EmblaCarouselType {
    slideNodes(): HTMLElement[]
    scrollTo(index: number): void
    selectedScrollSnap(): number
    canScrollNext(): boolean
    canScrollPrev(): boolean
    scrollNext(): void
    scrollPrev(): void
    on(event: EmblaEventType, callback: () => void): void
    off(event: EmblaEventType, callback: () => void): void
    viewportNode(): HTMLElement
    reInit(): void
    destroy(): void
  }
}