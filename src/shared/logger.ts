/**
 * Simple logger utility for Chrome extension
 * Provides consistent logging with proper error handling
 */

export class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    // In Chrome extensions, we can check if we're in development mode
    // Default to development mode in test environments
    try {
      // Check if we're in a test environment first
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
        this.isDevelopment = true;
        return;
      }

      this.isDevelopment = typeof chrome !== 'undefined' &&
        chrome.runtime &&
        chrome.runtime.getManifest &&
        !('update_url' in chrome.runtime.getManifest());
    } catch {
      // Default to development mode if we can't determine
      this.isDevelopment = true;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
     * Log warning messages
     */
  warn(message: string, error?: Error | unknown): void {
    if (this.isDevelopment) {
      if (error) {
        // eslint-disable-next-line no-console
        console.warn(message, error);
      } else {
        // eslint-disable-next-line no-console
        console.warn(message);
      }
    }
  }

  /**
     * Log error messages
     */
  error(message: string, error?: Error | unknown): void {
    if (this.isDevelopment) {
      if (error) {
        // eslint-disable-next-line no-console
        console.error(message, error);
      } else {
        // eslint-disable-next-line no-console
        console.error(message);
      }
    }
  }

  /**
     * Log info messages (development only)
     */
  info(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      if (data) {
        // eslint-disable-next-line no-console
        console.log(message, data);
      } else {
        // eslint-disable-next-line no-console
        console.log(message);
      }
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();