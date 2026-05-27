"use client";

import { useEffect } from "react";

/**
 * Hook to measure and report performance metrics
 * Helps identify bottlenecks and monitor Core Web Vitals
 */
export function usePerformanceMonitoring(componentName?: string) {
  useEffect(() => {
    // Only monitor in development or when explicitly enabled
    if (typeof window === "undefined") return;

    const isDev = process.env.NODE_ENV === "development";
    const enableMonitoring = isDev || localStorage.getItem("ENABLE_PERF_MONITORING");

    if (!enableMonitoring) return;

    // Measure component mount time
    const startTime = performance.now();
    const name = componentName || "Component";

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (isDev) {
        console.log(`[PERF] ${name} mounted in ${duration.toFixed(2)}ms`);
      }

      // Report to analytics if needed
      if (window.__PERF_METRICS__) {
        window.__PERF_METRICS__.push({
          component: name,
          duration,
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, [componentName]);
}

/**
 * Hook to measure interaction response times
 * Helps identify slow interactions
 */
export function useInteractionMetrics() {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      // Measure long tasks (tasks taking > 50ms)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(
              `[PERF] Long task detected: ${(entry.duration).toFixed(2)}ms`
            );
          }
        }
      });

      observer.observe({ entryTypes: ["longtask"] });

      return () => observer.disconnect();
    } catch (e) {
      // PerformanceObserver or longtask API not available
    }
  }, []);
}

/**
 * Hook to optimize re-renders
 * Logs unnecessary re-renders in development
 */
export function useRenderOptimization(componentName: string, deps: any[] = []) {
  const renderCountRef = React.useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;

    if (process.env.NODE_ENV === "development") {
      console.log(`[RENDER] ${componentName} rendered ${renderCountRef.current} times`);
    }
  }, deps);

  return renderCountRef.current;
}

/**
 * Defer non-critical updates to unblock user interactions
 * Similar to startTransition in React 18
 */
export function useDeferredValue<T>(value: T, delay: number = 0): T {
  const [deferredValue, setDeferredValue] = React.useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return deferredValue;
}

/**
 * Measure viewport changes and layout shifts
 */
export function useLayoutShiftDetection() {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };

          if (!layoutEntry.hadRecentInput) {
            const cls = layoutEntry.value ?? 0;
            if (cls > 0.1) {
              console.warn(
                `[PERF] Layout shift detected: ${(cls * 100).toFixed(2)}%`
              );
            }
          }
        }
      });

      observer.observe({ type: "layout-shift", buffered: true });

      return () => observer.disconnect();
    } catch (e) {
      // LayoutShift API not available
    }
  }, []);
}

declare global {
  interface Window {
    __PERF_METRICS__?: Array<{
      component: string;
      duration: number;
      timestamp: string;
    }>;
  }
}

import React from "react";
