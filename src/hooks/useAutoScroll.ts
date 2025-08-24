import { useEffect, useRef } from 'react';

export function useAutoScroll<T extends HTMLElement>(dependencies: any[]) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (elementRef.current) {
      const element = elementRef.current;

      // Find the scrollable container (could be the element itself or a child)
      const scrollableElement =
        element.scrollHeight > element.clientHeight
          ? element
          : element.querySelector('[data-radix-scroll-area-viewport]') ||
            element.querySelector('.ProseMirror') ||
            element;

      if (scrollableElement) {
        // Smooth scroll to bottom
        scrollableElement.scrollTo({
          top: scrollableElement.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, dependencies);

  return elementRef;
}
