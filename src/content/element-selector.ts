/**
 * @fileoverview ElementSelector - Element selection and inspection functionality
 * 
 * This class handles element selection on hover and click, element data extraction,
 * locator generation triggering, and Ctrl key detection for popup freezing.
 * 
 * Requirements Coverage:
 * - Requirement 1.2: Element selection on hover and click
 * - Requirement 1.4: Copy highest-rated locator on element click
 * - Requirement 1.5: Ctrl key detection for popup freezing functionality
 * 
 * Architecture:
 * - Single responsibility: focused on element selection and data extraction
 * - Callback-based integration for loose coupling with other components
 * - Error handling with graceful degradation for all DOM operations
 * - Fallback mechanisms for robust locator generation
 * - Integrates with existing CSS selector generator
 * 
 * Usage Example:
 * ```typescript
 * const selector = new ElementSelector();
 * selector.onElementSelected((locatorData) => {
 *   console.log('Element selected:', locatorData);
 * });
 * selector.handleElementClick(element, false);
 * ```
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import { LocatorData, ElementInfo, LocatorStrategy, ElementPosition } from '../shared/data-models';
import { CSSelectorGenerator } from '../shared/css-selector-generator';

/**
 * ElementSelector class for handling element selection and inspection
 */
export class ElementSelector {
    private elementSelectedCallbacks: ((locatorData: LocatorData) => void)[] = [];
    private elementHoveredCallbacks: ((elementInfo: ElementInfo) => void)[] = [];
    private cssGenerator: CSSelectorGenerator;

    constructor() {
        this.cssGenerator = new CSSelectorGenerator();
    }

    /**
     * Extract comprehensive element data including attributes, position, and metadata
     * 
     * @param element - The DOM element to extract data from
     * @returns ElementInfo object with complete element metadata
     * @throws Error if element is null or undefined
     * 
     * @example
     * ```typescript
     * const elementInfo = selector.extractElementData(buttonElement);
     * console.log(elementInfo.tagName); // 'BUTTON'
     * console.log(elementInfo.attributes.id); // 'submit-btn'
     * ```
     */
    extractElementData(element: HTMLElement): ElementInfo {
        if (!element) {
            throw new Error('Element cannot be null or undefined');
        }

        // Extract attributes
        const attributes: Record<string, string> = {};
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            attributes[attr.name] = attr.value;
        }

        // Extract position with error handling
        let position: ElementPosition;
        try {
            const rect = element.getBoundingClientRect();
            position = {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right
            };
        } catch (error) {
            // Fallback position if getBoundingClientRect fails
            position = {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            };
        }

        return {
            tagName: element.tagName,
            textContent: element.textContent || '',
            attributes,
            position,
            xpath: this.generateXPath(element)
        };
    }

    /**
     * Generate XPath for an element
     */
    generateXPath(element: HTMLElement): string {
        if (!element) {
            return '';
        }

        // Simple XPath generation - prioritize ID if available
        if (element.id) {
            return `//${element.tagName.toLowerCase()}[@id="${element.id}"]`;
        }

        // Fallback to basic tag-based XPath
        return `//${element.tagName.toLowerCase()}`;
    }

    /**
     * Handle element click with Ctrl key detection
     */
    handleElementClick(element: HTMLElement, isCtrlPressed: boolean): void {
        const locatorData = this.createLocatorData(element, window.location.href);

        // Trigger callbacks
        this.elementSelectedCallbacks.forEach(callback => callback(locatorData));

        // Copy to clipboard only if Ctrl is not pressed
        if (!isCtrlPressed) {
            const strategies = this.generateAllLocators(element);
            const highestRated = this.getHighestRatedLocator(strategies);
            this.copyToClipboard(highestRated);
        }
    }

    /**
     * Check if Ctrl key is pressed in an event
     */
    isCtrlKeyPressed(event: MouseEvent): boolean {
        return event.ctrlKey;
    }

    /**
     * Generate all locator strategies for an element
     */
    generateAllLocators(element: HTMLElement): LocatorStrategy[] {
        const strategies: LocatorStrategy[] = [];

        try {
            // Generate CSS selector
            const cssStrategy = this.cssGenerator.generateCSSSelector(element, document);
            strategies.push(cssStrategy);
        } catch (error) {
            // Handle CSS generation errors gracefully - provide fallback
            console.warn('CSS selector generation failed:', error);

            // Create fallback CSS strategy
            const fallbackSelector = element.id ? `#${element.id}` : element.tagName.toLowerCase();
            strategies.push({
                type: 'css',
                selector: fallbackSelector,
                confidence: {
                    score: 50,
                    factors: [],
                    warnings: ['Fallback selector due to generation error']
                },
                explanation: 'Fallback selector',
                isUnique: false,
                isStable: false
            });
        }

        // Sort by confidence score (highest first)
        return strategies.sort((a, b) => b.confidence.score - a.confidence.score);
    }

    /**
     * Create complete LocatorData object
     */
    createLocatorData(element: HTMLElement, url: string): LocatorData {
        const elementInfo = this.extractElementData(element);
        const strategies = this.generateAllLocators(element);

        return {
            id: this.generateId(),
            timestamp: Date.now(),
            url,
            elementInfo,
            strategies
        };
    }

    /**
     * Get the highest-rated locator selector
     */
    getHighestRatedLocator(strategies: LocatorStrategy[]): string {
        if (strategies.length === 0) {
            return '';
        }

        return strategies[0].selector;
    }

    /**
     * Copy text to clipboard
     */
    private async copyToClipboard(text: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            // Handle clipboard errors gracefully

        }
    }

    /**
     * Generate unique ID for locator data
     */
    private generateId(): string {
        return `locator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Register callback for element selection events
     */
    onElementSelected(callback: (locatorData: LocatorData) => void): void {
        this.elementSelectedCallbacks.push(callback);
    }

    /**
     * Register callback for element hover events
     */
    onElementHovered(callback: (elementInfo: ElementInfo) => void): void {
        this.elementHoveredCallbacks.push(callback);
    }

    /**
     * Trigger hover callbacks (for testing)
     */
    triggerHoverCallbacks(elementInfo: ElementInfo): void {
        this.elementHoveredCallbacks.forEach(callback => callback(elementInfo));
    }
}