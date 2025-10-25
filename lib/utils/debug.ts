/**
 * Debug configuration for development logging
 *
 * Set DEBUG_ENABLED to true to see verbose logs during development.
 * These logs are automatically disabled in production builds.
 */

// Enable/disable debug logs (only affects development mode)
export const DEBUG_ENABLED = true;

// Feature-specific debug flags
export const chatStoreDebug = false; // Chat store operations (snapshot, processing, setting chats)
export const chatScreenDebug = false; // Chat screen rendering and lifecycle

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
 * Chat store debug logger - only logs when chatStoreDebug is enabled
 */
export const chatStoreLog = (...args: any[]) => {
  if (__DEV__ && chatStoreDebug) {
    console.log(...args);
  }
};

/**
 * Chat screen debug logger - only logs when chatScreenDebug is enabled
 */
export const chatScreenLog = (...args: any[]) => {
  if (__DEV__ && chatScreenDebug) {
    console.log(...args);
  }
};

/**
 * Error logger - always logs errors even in production
 */
export const errorLog = (...args: any[]) => {
  console.error(...args);
};
