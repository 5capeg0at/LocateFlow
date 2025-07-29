/**
 * @fileoverview Tests for InspectionModeManager - TDD implementation
 * 
 * This test suite covers inspection mode activation/deactivation and service worker communication.
 * 
 * Requirements Coverage:
 * - Requirement 1.1: Extension inspection mode activation
 * - Requirement 1.6: Page interaction prevention during inspection mode
 * 
 * TDD Approach:
 * - RED: Write failing tests for inspection mode management
 * - GREEN: Implement minimal code to pass tests
 * - REFACTOR: Improve code structure while keeping tests green
 */

import { InspectionModeManager } from '../../src/content/inspection-mode-manager';

// Mock Chrome runtime API
const mockChrome = {
    runtime: {
        sendMessage: jest.fn(),
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        }
    }
};

// Mock DOM elements and events (removed unused variables)

describe('InspectionModeManager', () => {
    let manager: InspectionModeManager;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup global Chrome mock
        (global as any).chrome = mockChrome;

        // Create fresh instance
        manager = new InspectionModeManager();
    });

    afterEach(() => {
        // Clean up any active inspection mode
        if (manager.isInspectionModeActive()) {
            manager.deactivateInspectionMode();
        }
    });

    describe('Inspection Mode State Management', () => {
        test('should start with inspection mode inactive', () => {
            // ARRANGE & ACT - manager created in beforeEach

            // ASSERT
            expect(manager.isInspectionModeActive()).toBe(false);
        });

        test('should activate inspection mode when requested', () => {
            // ARRANGE - manager created in beforeEach

            // ACT
            manager.activateInspectionMode();

            // ASSERT
            expect(manager.isInspectionModeActive()).toBe(true);
        });

        test('should deactivate inspection mode when requested', () => {
            // ARRANGE
            manager.activateInspectionMode();
            expect(manager.isInspectionModeActive()).toBe(true);

            // ACT
            manager.deactivateInspectionMode();

            // ASSERT
            expect(manager.isInspectionModeActive()).toBe(false);
        });

        test('should handle multiple activation calls gracefully', () => {
            // ARRANGE - manager created in beforeEach

            // ACT
            manager.activateInspectionMode();
            manager.activateInspectionMode();
            manager.activateInspectionMode();

            // ASSERT
            expect(manager.isInspectionModeActive()).toBe(true);
        });

        test('should handle multiple deactivation calls gracefully', () => {
            // ARRANGE
            manager.activateInspectionMode();

            // ACT
            manager.deactivateInspectionMode();
            manager.deactivateInspectionMode();
            manager.deactivateInspectionMode();

            // ASSERT
            expect(manager.isInspectionModeActive()).toBe(false);
        });
    });

    describe('Page Interaction Prevention', () => {
        test('should prevent click events during inspection mode', () => {
            // ARRANGE
            manager.activateInspectionMode();
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

            // ACT
            document.body.dispatchEvent(clickEvent);

            // ASSERT
            expect(clickEvent.defaultPrevented).toBe(true);
        });

        test('should prevent link navigation during inspection mode', () => {
            // ARRANGE
            const link = document.createElement('a');
            link.href = 'https://example.com';
            document.body.appendChild(link);
            manager.activateInspectionMode();

            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

            // ACT
            link.dispatchEvent(clickEvent);

            // ASSERT
            expect(clickEvent.defaultPrevented).toBe(true);

            // CLEANUP
            document.body.removeChild(link);
        });

        test('should prevent form submission during inspection mode', () => {
            // ARRANGE
            const form = document.createElement('form');
            document.body.appendChild(form);
            manager.activateInspectionMode();

            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });

            // ACT
            form.dispatchEvent(submitEvent);

            // ASSERT
            expect(submitEvent.defaultPrevented).toBe(true);

            // CLEANUP
            document.body.removeChild(form);
        });

        test('should allow normal interactions when inspection mode is inactive', () => {
            // ARRANGE
            manager.deactivateInspectionMode();
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

            // ACT
            document.body.dispatchEvent(clickEvent);

            // ASSERT
            expect(clickEvent.defaultPrevented).toBe(false);
        });

        test('should restore normal interactions after deactivation', () => {
            // ARRANGE
            manager.activateInspectionMode();
            manager.deactivateInspectionMode();

            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

            // ACT
            document.body.dispatchEvent(clickEvent);

            // ASSERT
            expect(clickEvent.defaultPrevented).toBe(false);
        });
    });

    describe('Service Worker Communication', () => {
        test('should send activation message to service worker', () => {
            // ARRANGE - manager created in beforeEach

            // ACT
            manager.activateInspectionMode();

            // ASSERT
            expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
                type: 'INSPECTION_MODE_ACTIVATED'
                // tabId is omitted - service worker will determine it from sender
            });
        });

        test('should send deactivation message to service worker', () => {
            // ARRANGE
            manager.activateInspectionMode();
            jest.clearAllMocks(); // Clear the activation call

            // ACT
            manager.deactivateInspectionMode();

            // ASSERT
            expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
                type: 'INSPECTION_MODE_DEACTIVATED'
                // tabId is omitted - service worker will determine it from sender
            });
        });

        test('should register message listener for service worker commands', () => {
            // ARRANGE & ACT - manager created in beforeEach

            // ASSERT
            expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
                expect.any(Function)
            );
        });

        test('should handle activation command from service worker', () => {
            // ARRANGE
            const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
            const message = { type: 'ACTIVATE_INSPECTION_MODE' };
            const sender = {};
            const sendResponse = jest.fn();

            // ACT
            messageListener(message, sender, sendResponse);

            // ASSERT
            expect(manager.isInspectionModeActive()).toBe(true);
            expect(sendResponse).toHaveBeenCalledWith({ success: true });
        });

        test('should handle deactivation command from service worker', () => {
            // ARRANGE
            manager.activateInspectionMode();
            const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
            const message = { type: 'DEACTIVATE_INSPECTION_MODE' };
            const sender = {};
            const sendResponse = jest.fn();

            // ACT
            messageListener(message, sender, sendResponse);

            // ASSERT
            expect(manager.isInspectionModeActive()).toBe(false);
            expect(sendResponse).toHaveBeenCalledWith({ success: true });
        });

        test('should handle unknown messages gracefully', () => {
            // ARRANGE
            const messageListener = mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
            const message = { type: 'UNKNOWN_MESSAGE' };
            const sender = {};
            const sendResponse = jest.fn();

            // ACT
            messageListener(message, sender, sendResponse);

            // ASSERT
            expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Unknown message type' });
        });

        test('should handle service worker communication errors gracefully', () => {
            // ARRANGE
            mockChrome.runtime.sendMessage.mockImplementation(() => {
                throw new Error('Communication failed');
            });

            // ACT & ASSERT - should not throw
            expect(() => {
                manager.activateInspectionMode();
            }).not.toThrow();
        });
    });

    describe('Event Listener Management', () => {
        test('should add event listeners when inspection mode is activated', () => {
            // ARRANGE
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            // ACT
            manager.activateInspectionMode();

            // ASSERT
            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
            expect(addEventListenerSpy).toHaveBeenCalledWith('submit', expect.any(Function), true);

            // CLEANUP
            addEventListenerSpy.mockRestore();
        });

        test('should remove event listeners when inspection mode is deactivated', () => {
            // ARRANGE
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
            manager.activateInspectionMode();

            // ACT
            manager.deactivateInspectionMode();

            // ASSERT
            expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
            expect(removeEventListenerSpy).toHaveBeenCalledWith('submit', expect.any(Function), true);

            // CLEANUP
            removeEventListenerSpy.mockRestore();
        });

        test('should not add duplicate event listeners on multiple activations', () => {
            // ARRANGE
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            // ACT
            manager.activateInspectionMode();
            const firstCallCount = addEventListenerSpy.mock.calls.length;

            manager.activateInspectionMode();
            const secondCallCount = addEventListenerSpy.mock.calls.length;

            // ASSERT
            expect(secondCallCount).toBe(firstCallCount);

            // CLEANUP
            addEventListenerSpy.mockRestore();
        });
    });

    describe('Error Handling', () => {
        test('should handle DOM event listener errors gracefully', () => {
            // ARRANGE
            const originalAddEventListener = document.addEventListener;
            document.addEventListener = jest.fn().mockImplementation(() => {
                throw new Error('DOM error');
            });

            // ACT & ASSERT - should not throw
            expect(() => {
                manager.activateInspectionMode();
            }).not.toThrow();

            // CLEANUP
            document.addEventListener = originalAddEventListener;
        });

        test('should handle event prevention errors gracefully', () => {
            // ARRANGE
            manager.activateInspectionMode();

            // Create a real event and mock preventDefault to throw
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
            const originalPreventDefault = clickEvent.preventDefault;
            clickEvent.preventDefault = jest.fn().mockImplementation(() => {
                throw new Error('preventDefault failed');
            });

            // ACT & ASSERT - should not throw
            expect(() => {
                document.body.dispatchEvent(clickEvent);
            }).not.toThrow();

            // CLEANUP
            clickEvent.preventDefault = originalPreventDefault;
        });
    });

    describe('Integration with Other Components', () => {
        test('should provide callback registration for mode changes', () => {
            // ARRANGE
            const onActivateCallback = jest.fn();
            const onDeactivateCallback = jest.fn();

            manager.onModeActivated(onActivateCallback);
            manager.onModeDeactivated(onDeactivateCallback);

            // ACT
            manager.activateInspectionMode();
            manager.deactivateInspectionMode();

            // ASSERT
            expect(onActivateCallback).toHaveBeenCalledTimes(1);
            expect(onDeactivateCallback).toHaveBeenCalledTimes(1);
        });

        test('should handle multiple callback registrations', () => {
            // ARRANGE
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            const callback3 = jest.fn();

            manager.onModeActivated(callback1);
            manager.onModeActivated(callback2);
            manager.onModeActivated(callback3);

            // ACT
            manager.activateInspectionMode();

            // ASSERT
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
            expect(callback3).toHaveBeenCalledTimes(1);
        });
    });
});