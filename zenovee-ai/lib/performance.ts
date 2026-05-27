/**
 * Performance utilities for the application
 * Helper functions to improve app speed and responsiveness
 */

/**
 * Debounce function to limit function calls
 * Useful for search, resize events, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Throttle function to ensure function is called at most once per interval
 * Useful for scroll events, mouse move, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * RAF-based throttle for smooth 60fps animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number;
  let lastArgs: Parameters<T>;

  return function (...args: Parameters<T>) {
    lastArgs = args;

    if (rafId) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func(...lastArgs);
      rafId = 0;
    });
  };
}

/**
 * Batch DOM updates to avoid layout thrashing
 */
export function batchDOM(updates: Array<() => void>) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Lazy load an image with fade-in animation
 */
export function lazyLoadImage(
  element: HTMLImageElement,
  callback?: () => void
): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute("data-src");
          const srcset = img.getAttribute("data-srcset");

          if (src) {
            img.src = src;
          }
          if (srcset) {
            img.srcset = srcset;
          }

          img.classList.add("loaded");
          observer.unobserve(img);
          callback?.();
        }
      });
    },
    { rootMargin: "50px" }
  );

  observer.observe(element);
}

/**
 * Preload a resource (image, font, etc.)
 */
export function preloadResource(
  url: string,
  type: "image" | "font" | "script" | "style" = "image"
): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = url;

  if (type === "image") {
    link.as = "image";
  } else if (type === "font") {
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
  } else if (type === "script") {
    link.as = "script";
  } else if (type === "style") {
    link.as = "style";
  }

  document.head.appendChild(link);
}

/**
 * Prefetch a route for faster navigation
 */
export function prefetchRoute(href: string): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Monitor memory usage (development only)
 */
export function monitorMemoryUsage(): void {
  if (typeof window === "undefined") return;

  const perf = performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } };
  if (!perf.memory) return;

  const memory = perf.memory;
  const usage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);

  if (process.env.NODE_ENV === "development") {
    console.log(`[MEMORY] Heap usage: ${usage}%`);

    if (usage > 90) {
      console.warn("[MEMORY] High memory usage detected!");
    }
  }
}

/**
 * Request idle callback wrapper with fallback
 */
export function scheduleIdleTask(callback: IdleRequestCallback): number {
  if (typeof window === "undefined") {
    return -1;
  }

  const win = window as any;
  if ("requestIdleCallback" in win) {
    return win.requestIdleCallback(callback, { timeout: 2000 });
  }

  // Fallback for browsers that don't support requestIdleCallback
  return win.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 0,
    } as IdleDeadline);
  }, 0);
}

/**
 * Cancel idle task
 */
export function cancelIdleTask(id: number): void {
  if (typeof window === "undefined") {
    return;
  }

  const win = window as any;
  if ("cancelIdleCallback" in win) {
    win.cancelIdleCallback(id);
  } else {
    win.clearTimeout(id);
  }
}

/**
 * Measure time for code execution
 */
export function measureExecution(
  label: string,
  fn: () => void
): number {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === "development") {
    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
  }

  return duration;
}

/**
 * Measure async code execution
 */
export async function measureAsyncExecution<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === "development") {
    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Simple cache for expensive computations
 */
export function createMemoizer<T extends (...args: any[]) => any>(
  fn: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, any>();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) ?? JSON.stringify(args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (typeof firstKey === "string") {
        cache.delete(firstKey);
      }
    }

    return result;
  }) as T;
}

/**
 * Get Core Web Vitals metrics
 */
export function getCoreWebVitals(
  callback: (metrics: {
    cls: number;
    fcp: number;
    lcp: number;
    fid: number;
  }) => void
): void {
  if (typeof window === "undefined") return;

  const metrics = {
    cls: 0,
    fcp: 0,
    lcp: 0,
    fid: 0,
  };

  // CLS - Cumulative Layout Shift
  if ("PerformanceObserver" in window) {
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.cls += (entry as any).value;
        }
        callback(metrics);
      }).observe({ type: "layout-shift", buffered: true });

      // FCP - First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.fcp = entry.startTime;
        }
        callback(metrics);
      }).observe({ type: "paint", buffered: true });

      // LCP - Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.lcp = entry.startTime;
        }
        callback(metrics);
      }).observe({ type: "largest-contentful-paint", buffered: true });

      // FID - First Input Delay (via PerformanceEventTiming)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).processingStart - entry.startTime > 0) {
            metrics.fid = (entry as any).processingStart - entry.startTime;
            break;
          }
        }
        callback(metrics);
      }).observe({ type: "first-input", buffered: true });
    } catch (e) {
      // API not available
    }
  }
}
