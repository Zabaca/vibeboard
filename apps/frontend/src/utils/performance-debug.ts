export class PerformanceDebugger {
  private static timers: Map<string, number> = new Map();

  static start(label: string): void {
    PerformanceDebugger.timers.set(label, performance.now());
  }

  static end(label: string, threshold: number = 16): void {
    const start = PerformanceDebugger.timers.get(label);
    if (!start) {
      return;
    }

    const duration = performance.now() - start;
    if (duration > threshold) {
      console.warn(`[PERF] ${label} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
    PerformanceDebugger.timers.delete(label);
  }

  static measure<T>(label: string, fn: () => T, threshold: number = 16): T {
    PerformanceDebugger.start(label);
    const result = fn();
    PerformanceDebugger.end(label, threshold);
    return result;
  }

  static async measureAsync<T>(
    label: string,
    fn: () => Promise<T>,
    threshold: number = 16,
  ): Promise<T> {
    PerformanceDebugger.start(label);
    const result = await fn();
    PerformanceDebugger.end(label, threshold);
    return result;
  }

  static logRenderInfo(componentName: string, props: Record<string, any>): void {
    console.log(`[RENDER] ${componentName}`, {
      timestamp: new Date().toISOString(),
      propsKeys: Object.keys(props),
      env: import.meta.env.MODE,
    });
  }
}
