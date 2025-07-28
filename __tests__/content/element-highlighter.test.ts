/**
 * @fileoverview Tests for ElementHighlighter - Element highlighting system for DOM interaction
 * 
 * This test suite follows TDD methodology with Red-Green-Refactor cycles.
 * Tests cover element highlighting, visual feedback, hover state management, and highlight removal.
 * 
 * Requirements Coverage:
 * - Requirement 1.2: Element highlighting with visual indicator on hover
 * - Requirement 1.6: Prevent default page interactions during inspection mode
 */

import { ElementHighlighter } from '../../src/content/element-highlighter';

// Mock DOM methods and properties
const mockGetBoundingClientRect = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockPreventDefault = jest.fn();
const mockStopPropagation = jest.fn();

// Mock document methods
const mockCreateElement = jest.fn();
const mockGetElementById = jest.fn();
const mockQuerySelector = jest.fn();

// Setup DOM mocks
beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock document methods
    Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true
    });

    Object.defineProperty(document, 'getElementById', {
        value: mockGetElementById,
        writable: true
    });

    Object.defineProperty(document, 'querySelector', {
        value: mockQuerySelector,
        writable: true
    });

    // Mock document.body
    Object.defineProperty(document, 'body', {
        value: {
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener
        },
        writable: true
    });
});

describe('ElementHighlighter', () => {
    let highlighter: ElementHighlighter;
    let mockElement: HTMLElement;
    let mockOverlay: HTMLElement;

    beforeEach(() => {
        // Create mock element
        mockElement = {
            getBoundingClientRect: mockGetBoundingClientRect,
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener,
            tagName: 'DIV',
            id: 'test-element',
            className: 'test-class',
            contains: jest.fn()
        } as unknown as HTMLElement;

        // Create mock overlay element
        mockOverlay = {
            style: {},
            remove: jest.fn(),
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener
        } as unknown as HTMLElement;

        // Setup createElement mock to return overlay
        mockCreateElement.mockReturnValue(mockOverlay);

        // Setup getBoundingClientRect mock
        mockGetBoundingClientRect.mockReturnValue({
            top: 100,
            left: 200,
            width: 150,
            height: 50,
            right: 350,
            bottom: 150
        });

        highlighter = new ElementHighlighter();
    });

    describe('Initialization', () => {
        it('should create ElementHighlighter instance', () => {
            // RED: This test will fail because ElementHighlighter doesn't exist yet
            expect(highlighter).toBeInstanceOf(ElementHighlighter);
        });

        it('should initialize with inspection mode disabled', () => {
            // RED: This test will fail because isInspectionMode method doesn't exist
            expect(highlighter.isInspectionMode()).toBe(false);
        });

        it('should initialize with no currently highlighted element', () => {
            // RED: This test will fail because getCurrentHighlightedElement method doesn't exist
            expect(highlighter.getCurrentHighlightedElement()).toBeNull();
        });
    });

    describe('Inspection Mode Management', () => {
        it('should enable inspection mode', () => {
            // RED: This test will fail because enableInspectionMode method doesn't exist
            highlighter.enableInspectionMode();
            expect(highlighter.isInspectionMode()).toBe(true);
        });

        it('should disable inspection mode', () => {
            // RED: This test will fail because methods don't exist
            highlighter.enableInspectionMode();
            highlighter.disableInspectionMode();
            expect(highlighter.isInspectionMode()).toBe(false);
        });

        it('should add event listeners when enabling inspection mode', () => {
            // RED: This test will fail because enableInspectionMode doesn't add event listeners yet
            highlighter.enableInspectionMode();

            expect(document.body.addEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function), true);
            expect(document.body.addEventListener).toHaveBeenCalledWith('mouseout', expect.any(Function), true);
            expect(document.body.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
        });

        it('should remove event listeners when disabling inspection mode', () => {
            // RED: This test will fail because disableInspectionMode doesn't remove event listeners yet
            highlighter.enableInspectionMode();
            highlighter.disableInspectionMode();

            expect(document.body.removeEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function), true);
            expect(document.body.removeEventListener).toHaveBeenCalledWith('mouseout', expect.any(Function), true);
            expect(document.body.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
        });

        it('should remove existing highlight when disabling inspection mode', () => {
            // RED: This test will fail because removeHighlight method doesn't exist
            highlighter.enableInspectionMode();
            highlighter.highlightElement(mockElement);
            highlighter.disableInspectionMode();

            expect(highlighter.getCurrentHighlightedElement()).toBeNull();
        });
    });

    describe('Element Highlighting', () => {
        beforeEach(() => {
            highlighter.enableInspectionMode();
        });

        it('should highlight element with visual overlay', () => {
            // RED: This test will fail because highlightElement method doesn't exist
            highlighter.highlightElement(mockElement);

            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalledWith(mockOverlay);
            expect(highlighter.getCurrentHighlightedElement()).toBe(mockElement);
        });

        it('should position overlay correctly based on element bounds', () => {
            // RED: This test will fail because overlay positioning logic doesn't exist
            highlighter.highlightElement(mockElement);

            expect(mockElement.getBoundingClientRect).toHaveBeenCalled();
            expect(mockOverlay.style.position).toBe('fixed');
            expect(mockOverlay.style.top).toBe('100px');
            expect(mockOverlay.style.left).toBe('200px');
            expect(mockOverlay.style.width).toBe('150px');
            expect(mockOverlay.style.height).toBe('50px');
        });

        it('should apply correct styling to highlight overlay', () => {
            // RED: This test will fail because overlay styling logic doesn't exist
            highlighter.highlightElement(mockElement);

            expect(mockOverlay.style.border).toBe('2px solid #007acc');
            expect(mockOverlay.style.backgroundColor).toBe('rgba(0, 122, 204, 0.1)');
            expect(mockOverlay.style.pointerEvents).toBe('none');
            expect(mockOverlay.style.zIndex).toBe('999999');
        });

        it('should remove previous highlight when highlighting new element', () => {
            // RED: This test will fail because removeHighlight logic doesn't exist
            const mockElement2 = { ...mockElement, id: 'test-element-2' } as HTMLElement;

            highlighter.highlightElement(mockElement);
            const firstOverlay = mockOverlay;

            // Setup new overlay for second element
            const mockOverlay2 = { ...mockOverlay, remove: jest.fn() } as unknown as HTMLElement;
            mockCreateElement.mockReturnValue(mockOverlay2);

            highlighter.highlightElement(mockElement2);

            expect(firstOverlay.remove).toHaveBeenCalled();
            expect(highlighter.getCurrentHighlightedElement()).toBe(mockElement2);
        });

        it('should not highlight element when inspection mode is disabled', () => {
            // RED: This test will fail because inspection mode check doesn't exist
            highlighter.disableInspectionMode();
            highlighter.highlightElement(mockElement);

            expect(document.createElement).not.toHaveBeenCalled();
            expect(highlighter.getCurrentHighlightedElement()).toBeNull();
        });
    });

    describe('Highlight Removal', () => {
        beforeEach(() => {
            highlighter.enableInspectionMode();
            highlighter.highlightElement(mockElement);
        });

        it('should remove highlight overlay from DOM', () => {
            // RED: This test will fail because removeHighlight method doesn't exist
            highlighter.removeHighlight();

            expect(mockOverlay.remove).toHaveBeenCalled();
            expect(highlighter.getCurrentHighlightedElement()).toBeNull();
        });

        it('should handle removing highlight when no element is highlighted', () => {
            // RED: This test will fail because removeHighlight doesn't handle null case
            highlighter.removeHighlight();
            highlighter.removeHighlight(); // Call again when nothing is highlighted

            // Should not throw error
            expect(highlighter.getCurrentHighlightedElement()).toBeNull();
        });
    });

    describe('Event Handling', () => {
        beforeEach(() => {
            highlighter.enableInspectionMode();
        });

        it('should prevent default click behavior during inspection', () => {
            // RED: This test will fail because click event prevention doesn't exist
            const mockEvent = {
                preventDefault: mockPreventDefault,
                stopPropagation: mockStopPropagation,
                target: mockElement
            } as unknown as Event;

            // Simulate click event
            const clickHandler = mockAddEventListener.mock.calls.find(
                call => call[0] === 'click'
            )?.[1];

            expect(clickHandler).toBeDefined();
            clickHandler(mockEvent);

            expect(mockPreventDefault).toHaveBeenCalled();
            expect(mockStopPropagation).toHaveBeenCalled();
        });

        it('should highlight element on mouseover', () => {
            // RED: This test will fail because mouseover handler doesn't exist
            const mockEvent = {
                target: mockElement
            } as unknown as Event;

            // Simulate mouseover event
            const mouseoverHandler = mockAddEventListener.mock.calls.find(
                call => call[0] === 'mouseover'
            )?.[1];

            expect(mouseoverHandler).toBeDefined();
            mouseoverHandler(mockEvent);

            expect(highlighter.getCurrentHighlightedElement()).toBe(mockElement);
        });

        it('should remove highlight on mouseout', () => {
            // RED: This test will fail because mouseout handler doesn't exist
            highlighter.highlightElement(mockElement);

            // Mock contains to return false for non-child element
            (mockElement.contains as jest.Mock).mockReturnValue(false);

            const mockEvent = {
                target: mockElement,
                relatedTarget: document.body
            } as unknown as Event;

            // Simulate mouseout event
            const mouseoutHandler = mockAddEventListener.mock.calls.find(
                call => call[0] === 'mouseout'
            )?.[1];

            expect(mouseoutHandler).toBeDefined();
            mouseoutHandler(mockEvent);

            expect(highlighter.getCurrentHighlightedElement()).toBeNull();
        });

        it('should not remove highlight on mouseout to child element', () => {
            // RED: This test will fail because child element detection doesn't exist
            highlighter.highlightElement(mockElement);

            const mockChildElement = {
                parentElement: mockElement
            } as unknown as HTMLElement;

            // Mock contains to return true for child element
            (mockElement.contains as jest.Mock).mockReturnValue(true);

            const mockEvent = {
                target: mockElement,
                relatedTarget: mockChildElement
            } as unknown as Event;

            // Simulate mouseout event to child
            const mouseoutHandler = mockAddEventListener.mock.calls.find(
                call => call[0] === 'mouseout'
            )?.[1];

            mouseoutHandler(mockEvent);

            expect(highlighter.getCurrentHighlightedElement()).toBe(mockElement);
        });
    });

    describe('Hover State Management', () => {
        beforeEach(() => {
            highlighter.enableInspectionMode();
        });

        it('should track hover state correctly', () => {
            // RED: This test will fail because hover state tracking doesn't exist
            expect(highlighter.isHovering()).toBe(false);

            highlighter.highlightElement(mockElement);
            expect(highlighter.isHovering()).toBe(true);

            highlighter.removeHighlight();
            expect(highlighter.isHovering()).toBe(false);
        });

        it('should emit hover events for external listeners', () => {
            // RED: This test will fail because event emission doesn't exist
            const mockHoverCallback = jest.fn();
            highlighter.onHover(mockHoverCallback);

            highlighter.highlightElement(mockElement);

            expect(mockHoverCallback).toHaveBeenCalledWith(mockElement);
        });

        it('should emit unhover events for external listeners', () => {
            // RED: This test will fail because event emission doesn't exist
            const mockUnhoverCallback = jest.fn();
            highlighter.onUnhover(mockUnhoverCallback);

            highlighter.highlightElement(mockElement);
            highlighter.removeHighlight();

            expect(mockUnhoverCallback).toHaveBeenCalledWith(mockElement);
        });
    });

    describe('Error Handling', () => {
        it('should handle null element gracefully', () => {
            // RED: This test will fail because null element handling doesn't exist
            highlighter.enableInspectionMode();

            expect(() => {
                highlighter.highlightElement(null as any);
            }).not.toThrow();

            expect(highlighter.getCurrentHighlightedElement()).toBeNull();
        });

        it('should handle getBoundingClientRect errors gracefully', () => {
            // RED: This test will fail because error handling doesn't exist
            mockGetBoundingClientRect.mockImplementation(() => {
                throw new Error('getBoundingClientRect failed');
            });

            highlighter.enableInspectionMode();

            expect(() => {
                highlighter.highlightElement(mockElement);
            }).not.toThrow();

            expect(highlighter.getCurrentHighlightedElement()).toBeNull();
        });

        it('should handle DOM manipulation errors gracefully', () => {
            // RED: This test will fail because DOM error handling doesn't exist
            mockCreateElement.mockImplementation(() => {
                throw new Error('createElement failed');
            });

            highlighter.enableInspectionMode();

            expect(() => {
                highlighter.highlightElement(mockElement);
            }).not.toThrow();

            expect(highlighter.getCurrentHighlightedElement()).toBeNull();
        });
    });
});