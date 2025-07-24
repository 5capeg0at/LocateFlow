/**
 * @fileoverview Test suite for ErrorHandler class
 * Tests error categorization, logging, and context preservation functionality
 * Following TDD Red-Green-Refactor methodology
 */

import { ErrorHandler, ErrorContext, ErrorCategory } from '../../src/shared/error-handler';

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;
    let mockConsole: jest.SpyInstance;

    beforeEach(() => {
        errorHandler = new ErrorHandler();
        mockConsole = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        mockConsole.mockRestore();
    });

    describe('Error Categorization', () => {
        it('should categorize DOM access errors correctly', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const domError = new Error('Cannot access property of null');
            const context: ErrorContext = {
                component: 'content-script',
                operation: 'element-selection',
                timestamp: Date.now()
            };

            const result = errorHandler.categorizeError(domError, context);

            expect(result.category).toBe(ErrorCategory.DOM_ACCESS);
            expect(result.severity).toBe('medium');
            expect(result.recoverable).toBe(true);
        });

        it('should categorize storage errors correctly', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const storageError = new Error('QuotaExceededError');
            const context: ErrorContext = {
                component: 'storage-manager',
                operation: 'save-preferences',
                timestamp: Date.now()
            };

            const result = errorHandler.categorizeError(storageError, context);

            expect(result.category).toBe(ErrorCategory.STORAGE);
            expect(result.severity).toBe('high');
            expect(result.recoverable).toBe(true);
        });

        it('should categorize content script injection errors correctly', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const injectionError = new Error('Could not establish connection');
            const context: ErrorContext = {
                component: 'service-worker',
                operation: 'inject-content-script',
                tabId: 123,
                timestamp: Date.now()
            };

            const result = errorHandler.categorizeError(injectionError, context);

            expect(result.category).toBe(ErrorCategory.CONTENT_SCRIPT_INJECTION);
            expect(result.severity).toBe('high');
            expect(result.recoverable).toBe(true);
        });

        it('should categorize locator generation errors correctly', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const locatorError = new Error('Invalid XPath expression');
            const context: ErrorContext = {
                component: 'locator-engine',
                operation: 'generate-xpath',
                url: 'https://example.com',
                timestamp: Date.now()
            };

            const result = errorHandler.categorizeError(locatorError, context);

            expect(result.category).toBe(ErrorCategory.LOCATOR_GENERATION);
            expect(result.severity).toBe('medium');
            expect(result.recoverable).toBe(true);
        });

        it('should categorize unknown errors as general errors', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const unknownError = new Error('Something unexpected happened');
            const context: ErrorContext = {
                component: 'unknown',
                operation: 'unknown-operation',
                timestamp: Date.now()
            };

            const result = errorHandler.categorizeError(unknownError, context);

            expect(result.category).toBe(ErrorCategory.GENERAL);
            expect(result.severity).toBe('medium');
            expect(result.recoverable).toBe(false);
        });
    });

    describe('Error Logging', () => {
        it('should log errors to console with proper formatting', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const error = new Error('Test error message');
            const context: ErrorContext = {
                component: 'test-component',
                operation: 'test-operation',
                timestamp: Date.now()
            };

            errorHandler.logError(error, context);

            expect(mockConsole).toHaveBeenCalledWith(
                expect.stringContaining('[LocateFlow Extension Error]'),
                expect.objectContaining({
                    message: 'Test error message',
                    component: 'test-component',
                    operation: 'test-operation',
                    timestamp: expect.any(Number),
                    stack: expect.any(String)
                })
            );
        });

        it('should include tab ID in log when provided', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const error = new Error('Tab-specific error');
            const context: ErrorContext = {
                component: 'content-script',
                operation: 'element-highlight',
                tabId: 456,
                timestamp: Date.now()
            };

            errorHandler.logError(error, context);

            expect(mockConsole).toHaveBeenCalledWith(
                expect.stringContaining('[LocateFlow Extension Error]'),
                expect.objectContaining({
                    tabId: 456
                })
            );
        });

        it('should include URL in log when provided', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const error = new Error('URL-specific error');
            const context: ErrorContext = {
                component: 'locator-engine',
                operation: 'generate-locators',
                url: 'https://test.example.com',
                timestamp: Date.now()
            };

            errorHandler.logError(error, context);

            expect(mockConsole).toHaveBeenCalledWith(
                expect.stringContaining('[LocateFlow Extension Error]'),
                expect.objectContaining({
                    url: 'https://test.example.com'
                })
            );
        });
    });

    describe('Specific Error Handlers', () => {
        it('should handle DOM errors with graceful degradation', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const domError = new Error('Element not found');
            const context = 'element-selection';

            const result = errorHandler.handleDOMError(domError, context);

            expect(result.handled).toBe(true);
            expect(result.fallbackAction).toBe('retry-with-timeout');
            expect(result.userMessage).toContain('Unable to access element');
            expect(mockConsole).toHaveBeenCalled();
        });

        it('should handle storage errors with fallback mechanisms', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const storageError = new Error('Storage quota exceeded');
            const operation = 'save-history';

            const result = errorHandler.handleStorageError(storageError, operation);

            expect(result.handled).toBe(true);
            expect(result.fallbackAction).toBe('use-session-storage');
            expect(result.userMessage).toContain('Storage limit reached');
            expect(mockConsole).toHaveBeenCalled();
        });

        it('should handle injection errors with retry logic', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const injectionError = new Error('Script injection failed');
            const tabId = 789;

            const result = errorHandler.handleInjectionError(injectionError, tabId);

            expect(result.handled).toBe(true);
            expect(result.fallbackAction).toBe('retry-with-backoff');
            expect(result.userMessage).toContain('Page inspection unavailable');
            expect(result.retryCount).toBe(1);
            expect(mockConsole).toHaveBeenCalled();
        });

        it('should handle locator generation errors with fallback strategies', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const locatorError = new Error('XPath generation failed');
            const strategy = 'xpath';

            const result = errorHandler.handleLocatorError(locatorError, strategy);

            expect(result.handled).toBe(true);
            expect(result.fallbackAction).toBe('use-alternative-strategy');
            expect(result.alternativeStrategies).toContain('css');
            expect(result.userMessage).toContain('Locator generation issue');
            expect(mockConsole).toHaveBeenCalled();
        });
    });

    describe('Context Preservation', () => {
        it('should preserve error context for debugging', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const error = new Error('Context preservation test');
            const context: ErrorContext = {
                component: 'popup',
                operation: 'copy-locator',
                tabId: 101,
                url: 'https://context.example.com',
                timestamp: Date.now(),
                additionalData: {
                    locatorType: 'css',
                    elementTag: 'button'
                }
            };

            errorHandler.logError(error, context);

            expect(mockConsole).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    component: 'popup',
                    operation: 'copy-locator',
                    tabId: 101,
                    url: 'https://context.example.com',
                    additionalData: {
                        locatorType: 'css',
                        elementTag: 'button'
                    }
                })
            );
        });

        it('should track error patterns for pattern recognition', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const error1 = new Error('Pattern test error');
            const error2 = new Error('Pattern test error');
            const context: ErrorContext = {
                component: 'locator-engine',
                operation: 'generate-css',
                timestamp: Date.now()
            };

            errorHandler.logError(error1, context);
            errorHandler.logError(error2, context);

            const patterns = errorHandler.getErrorPatterns();
            expect(patterns).toHaveLength(1);
            expect(patterns[0].message).toBe('Pattern test error');
            expect(patterns[0].count).toBe(2);
            expect(patterns[0].component).toBe('locator-engine');
        });

        it('should prevent memory leaks by cleaning up old patterns', () => {
            // Generate more than MAX_PATTERN_ENTRIES (100) unique errors
            for (let i = 0; i < 105; i++) {
                const error = new Error(`Test error ${i}`);
                const context: ErrorContext = {
                    component: 'test-component',
                    operation: `test-operation-${i}`,
                    timestamp: Date.now() + i // Ensure different timestamps
                };
                errorHandler.logError(error, context);
            }

            const patterns = errorHandler.getErrorPatterns();
            // Should have cleaned up old patterns to stay under limit
            expect(patterns.length).toBeLessThanOrEqual(100);
            // Should have kept the most recent patterns
            expect(patterns.some(p => p.message === 'Test error 104')).toBe(true);
        });
    });

    describe('Graceful Failure', () => {
        it('should not throw errors during error handling', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const malformedError = null as any;
            const context: ErrorContext = {
                component: 'test',
                operation: 'test',
                timestamp: Date.now()
            };

            expect(() => {
                errorHandler.logError(malformedError, context);
            }).not.toThrow();

            expect(mockConsole).toHaveBeenCalledWith(
                expect.stringContaining('[LocateFlow Extension Error]'),
                expect.objectContaining({
                    message: 'Unknown error occurred',
                    originalError: null
                })
            );
        });

        it('should handle circular reference errors safely', () => {
            // RED: This test will fail because ErrorHandler doesn't exist yet
            const circularObj: any = { name: 'test' };
            circularObj.self = circularObj;

            const context: ErrorContext = {
                component: 'test',
                operation: 'test',
                timestamp: Date.now(),
                additionalData: circularObj
            };

            expect(() => {
                errorHandler.logError(new Error('Circular test'), context);
            }).not.toThrow();

            expect(mockConsole).toHaveBeenCalled();
        });
    });
});