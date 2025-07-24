/**
 * @fileoverview ErrorHandler class for categorizing, logging, and handling errors
 * Provides graceful error handling and context preservation for debugging
 * Implements requirements from Non-functional requirement 2
 * 
 * @example
 * ```typescript
 * const errorHandler = new ErrorHandler();
 * 
 * try {
 *   // Risky DOM operation
 *   const element = document.querySelector('#nonexistent');
 *   element.click(); // This will throw
 * } catch (error) {
 *   const result = errorHandler.handleDOMError(error, 'element-selection');
 *   if (result.fallbackAction === 'retry-with-timeout') {
 *     // Implement retry logic
 *   }
 * }
 * ```
 */

/**
 * Error categories for different types of extension errors
 */
export enum ErrorCategory {
    DOM_ACCESS = 'dom-access',
    STORAGE = 'storage',
    CONTENT_SCRIPT_INJECTION = 'content-script-injection',
    LOCATOR_GENERATION = 'locator-generation',
    GENERAL = 'general'
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Context information for error tracking and debugging
 */
export interface ErrorContext {
    component: string;
    operation: string;
    tabId?: number;
    url?: string;
    timestamp: number;
    additionalData?: Record<string, any>;
}

/**
 * Result of error categorization
 */
export interface ErrorCategorization {
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
}

/**
 * Result of error handling operations
 */
export interface ErrorHandlingResult {
    handled: boolean;
    fallbackAction: string;
    userMessage: string;
    retryCount?: number;
    alternativeStrategies?: string[];
}

/**
 * Error pattern tracking for pattern recognition
 */
export interface ErrorPattern {
    message: string;
    count: number;
    component: string;
    operation: string;
    lastOccurrence: number;
}

/**
 * ErrorHandler class for comprehensive error management
 * Handles error categorization, logging, and graceful failure
 * 
 * Features:
 * - Automatic error categorization based on message patterns
 * - Rich context preservation for debugging
 * - Graceful fallback mechanisms for different error types
 * - Pattern recognition for continuous improvement
 * - Safe error logging that never throws
 */
export class ErrorHandler {
    private errorPatterns: Map<string, ErrorPattern> = new Map();
    private readonly MAX_PATTERN_ENTRIES = 100; // Prevent memory leaks

    /**
     * Categorizes an error based on its message and context
     */
    categorizeError(error: Error, context: ErrorContext): ErrorCategorization {
        const message = error?.message || '';

        // DOM Access Errors
        if (message.includes('Cannot access property of null') ||
            message.includes('Element not found') ||
            message.includes('querySelector') ||
            message.includes('getElementById')) {
            return {
                category: ErrorCategory.DOM_ACCESS,
                severity: 'medium',
                recoverable: true
            };
        }

        // Storage Errors
        if (message.includes('QuotaExceededError') ||
            message.includes('Storage quota exceeded') ||
            message.includes('chrome.storage') ||
            context.component === 'storage-manager') {
            return {
                category: ErrorCategory.STORAGE,
                severity: 'high',
                recoverable: true
            };
        }

        // Content Script Injection Errors
        if (message.includes('Could not establish connection') ||
            message.includes('Script injection failed') ||
            message.includes('chrome.scripting') ||
            context.operation === 'inject-content-script') {
            return {
                category: ErrorCategory.CONTENT_SCRIPT_INJECTION,
                severity: 'high',
                recoverable: true
            };
        }

        // Locator Generation Errors
        if (message.includes('Invalid XPath expression') ||
            message.includes('XPath generation failed') ||
            message.includes('CSS selector') ||
            context.component === 'locator-engine') {
            return {
                category: ErrorCategory.LOCATOR_GENERATION,
                severity: 'medium',
                recoverable: true
            };
        }

        // Default to general error
        return {
            category: ErrorCategory.GENERAL,
            severity: 'medium',
            recoverable: false
        };
    }

    /**
     * Logs error to browser console with proper formatting and context
     */
    logError(error: Error | null, context: ErrorContext): void {
        try {
            const errorMessage = error?.message || 'Unknown error occurred';
            const errorStack = error?.stack || 'No stack trace available';

            const logData = {
                message: errorMessage,
                component: context.component,
                operation: context.operation,
                timestamp: context.timestamp,
                stack: errorStack,
                ...(context.tabId && { tabId: context.tabId }),
                ...(context.url && { url: context.url }),
                ...(context.additionalData && { additionalData: this.safeStringify(context.additionalData) }),
                ...(error === null && { originalError: null })
            };

            console.error('[LocateFlow Extension Error]', logData);

            // Track error patterns
            this.trackErrorPattern(error, context);
        } catch (loggingError) {
            // Fail gracefully - don't let error logging crash the extension
            console.error('[LocateFlow Extension Error] Failed to log error:', loggingError);
        }
    }

    /**
     * Handles DOM access errors with graceful degradation
     */
    handleDOMError(error: Error, context: string): ErrorHandlingResult {
        const errorContext: ErrorContext = {
            component: 'content-script',
            operation: context,
            timestamp: Date.now()
        };

        this.logError(error, errorContext);

        return {
            handled: true,
            fallbackAction: 'retry-with-timeout',
            userMessage: 'Unable to access element. Please try again.'
        };
    }

    /**
     * Handles storage errors with fallback mechanisms
     */
    handleStorageError(error: Error, operation: string): ErrorHandlingResult {
        const errorContext: ErrorContext = {
            component: 'storage-manager',
            operation: operation,
            timestamp: Date.now()
        };

        this.logError(error, errorContext);

        return {
            handled: true,
            fallbackAction: 'use-session-storage',
            userMessage: 'Storage limit reached. Using temporary storage.'
        };
    }

    /**
     * Handles content script injection errors with retry logic
     */
    handleInjectionError(error: Error, tabId: number): ErrorHandlingResult {
        const errorContext: ErrorContext = {
            component: 'service-worker',
            operation: 'inject-content-script',
            tabId: tabId,
            timestamp: Date.now()
        };

        this.logError(error, errorContext);

        return {
            handled: true,
            fallbackAction: 'retry-with-backoff',
            userMessage: 'Page inspection unavailable. Retrying...',
            retryCount: 1
        };
    }

    /**
     * Handles locator generation errors with fallback strategies
     */
    handleLocatorError(error: Error, strategy: string): ErrorHandlingResult {
        const errorContext: ErrorContext = {
            component: 'locator-engine',
            operation: `generate-${strategy}`,
            timestamp: Date.now(),
            additionalData: { strategy }
        };

        this.logError(error, errorContext);

        return {
            handled: true,
            fallbackAction: 'use-alternative-strategy',
            userMessage: 'Locator generation issue. Trying alternative methods.',
            alternativeStrategies: ['css', 'id', 'class', 'tag']
        };
    }

    /**
     * Gets tracked error patterns for pattern recognition
     */
    getErrorPatterns(): ErrorPattern[] {
        return Array.from(this.errorPatterns.values());
    }

    /**
     * Tracks error patterns for pattern recognition
     */
    private trackErrorPattern(error: Error | null, context: ErrorContext): void {
        if (!error) return;

        const patternKey = `${error.message}-${context.component}-${context.operation}`;
        const existing = this.errorPatterns.get(patternKey);

        if (existing) {
            existing.count++;
            existing.lastOccurrence = context.timestamp;
        } else {
            // Clean up old patterns if we're at the limit
            if (this.errorPatterns.size >= this.MAX_PATTERN_ENTRIES) {
                this.cleanupOldPatterns();
            }

            this.errorPatterns.set(patternKey, {
                message: error.message,
                count: 1,
                component: context.component,
                operation: context.operation,
                lastOccurrence: context.timestamp
            });
        }
    }

    /**
     * Cleans up old error patterns to prevent memory leaks
     */
    private cleanupOldPatterns(): void {
        const patterns = Array.from(this.errorPatterns.entries());
        // Sort by last occurrence, oldest first
        patterns.sort((a, b) => a[1].lastOccurrence - b[1].lastOccurrence);

        // Remove the oldest 20% of patterns
        const toRemove = Math.floor(patterns.length * 0.2);
        for (let i = 0; i < toRemove; i++) {
            this.errorPatterns.delete(patterns[i][0]);
        }
    }

    /**
     * Safely stringify objects, handling circular references
     */
    private safeStringify(obj: any): any {
        try {
            // Try normal JSON stringify first
            JSON.stringify(obj);
            return obj;
        } catch (error) {
            // Handle circular references
            const seen = new WeakSet();
            return JSON.parse(JSON.stringify(obj, (_key, val) => {
                if (val != null && typeof val === 'object') {
                    if (seen.has(val)) {
                        return '[Circular Reference]';
                    }
                    seen.add(val);
                }
                return val;
            }));
        }
    }
}