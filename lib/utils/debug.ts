/**
 * Debug configuration for development logging
 *
 * Set DEBUG_ENABLED to true to see verbose logs during development.
 * These logs are automatically disabled in production builds.
 */

// Enable/disable debug logs (only affects development mode)
export const DEBUG_ENABLED = true;

/**
 * Debug logger that only logs when DEBUG_ENABLED is true and in DEV mode
 */
export const debugLog = (...args: any[]) => {
  if (__DEV__ && DEBUG_ENABLED) {
    console.log(...args);
  }
};

/**
 * Debug warn that only warns when DEBUG_ENABLED is true and in DEV mode
 */
export const debugWarn = (...args: any[]) => {
  if (__DEV__ && DEBUG_ENABLED) {
    console.warn(...args);
  }
};

/**
 * Error logger - always logs errors even in production
 */
export const errorLog = (...args: any[]) => {
  console.error(...args);
};
