interface PerformanceMark {
  name: string;
  timestamp: number;
}

interface PerformanceMeasurement {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measurements: PerformanceMeasurement[] = [];

  /**
   * Store a timestamp with a name
   */
  mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  /**
   * Calculate duration between two marks
   * Logs warning if duration > 200ms (rubric requirement)
   */
  measure(measureName: string, startMark: string, endMark?: string): void {
    const startTime = this.marks.get(startMark);

    if (!startTime) {
      console.warn(`PerformanceMonitor: Start mark "${startMark}" not found`);
      return;
    }

    const endTime = endMark ? this.marks.get(endMark) : Date.now();

    if (endMark && !endTime) {
      console.warn(`PerformanceMonitor: End mark "${endMark}" not found`);
      return;
    }

    const duration = (endTime as number) - startTime;

    const measurement: PerformanceMeasurement = {
      name: measureName,
      duration,
      startTime,
      endTime: endTime as number,
    };

    this.measurements.push(measurement);

    // Log warning if duration exceeds 200ms
    if (duration > 200) {
      console.warn(
        `⚠️ Performance Warning: ${measureName} took ${duration}ms (threshold: 200ms)`
      );
    } else {
      console.log(`✅ Performance: ${measureName} took ${duration}ms`);
    }
  }

  /**
   * Return all measurements
   */
  getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements];
  }

  /**
   * Clear all marks
   */
  clearMarks(): void {
    this.marks.clear();
  }

  /**
   * Clear all measurements
   */
  clearMeasurements(): void {
    this.measurements = [];
  }
}

// Export singleton instance for app-wide access
export const performanceMonitor = new PerformanceMonitor();
