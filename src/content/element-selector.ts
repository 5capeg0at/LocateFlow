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
import { XPathGenerator } from '../shared/xpath-generator';

/**
 * ElementSelector class for handling element selection and inspection
 */
export class ElementSelector {
    private elementSelectedCallbacks: ((locatorData: LocatorData) => void)[] = [];
    private elementHoveredCallbacks: ((elementInfo: ElementInfo) => void)[] = [];
    private cssGenerator: CSSelectorGenerator;
    private xpathGenerator: XPathGenerator;

    constructor() {
        this.cssGenerator = new CSSelectorGenerator();
        this.xpathGenerator = new XPathGenerator();
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
     * Generate XPath for an element using comprehensive XPathGenerator
     */
    generateXPath(element: HTMLElement): string {
        if (!element) {
            return '';
        }

        try {
            const xpathStrategy = this.xpathGenerator.generateXPath(element, document);
            return xpathStrategy.selector;
        } catch (error) {
            console.warn('XPath generation failed, using fallback:', error);
            // Fallback to basic tag-based XPath
            return `//${element.tagName.toLowerCase()}`;
        }
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

        // Generate ID locator first if available (highest priority)
        if (element.id && element.id.trim()) {
            strategies.push(this.generateIdLocator(element));
        }

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

        try {
            // Generate XPath selector
            const xpathStrategy = this.xpathGenerator.generateXPath(element, document);
            strategies.push(xpathStrategy);
        } catch (error) {
            console.warn('XPath generation failed:', error);
        }

        // Generate Class locator if available
        if (element.className && element.className.trim()) {
            strategies.push(this.generateClassLocator(element));
        }

        // Generate Name locator if available
        const nameAttr = element.getAttribute('name');
        if (nameAttr && nameAttr.trim()) {
            strategies.push(this.generateNameLocator(element, nameAttr));
        }

        // Generate Tag locator
        strategies.push(this.generateTagLocator(element));

        // Generate ARIA locators if available
        const ariaLocators = this.generateAriaLocators(element);
        strategies.push(...ariaLocators);

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
            console.error('Failed to copy to clipboard:', error);
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

    /**
     * Generate ID-based locator strategy
     */
    private generateIdLocator(element: HTMLElement): LocatorStrategy {
        const selector = `#${element.id}`;
        const isUnique = document.querySelectorAll(selector).length === 1;

        return {
            type: 'id',
            selector,
            confidence: {
                score: isUnique ? 98 : 70, // Highest confidence for unique IDs
                factors: [
                    {
                        factor: 'ID attribute',
                        impact: 'positive',
                        weight: 0.9,
                        description: 'ID attributes are highly reliable for element identification'
                    }
                ],
                warnings: isUnique ? [] : ['ID is not unique on the page']
            },
            explanation: `Uses element ID "${element.id}" for identification`,
            isUnique,
            isStable: true
        };
    }

    /**
     * Generate Class-based locator strategy
     */
    private generateClassLocator(element: HTMLElement): LocatorStrategy {
        const classes = element.className.trim().split(/\s+/);
        const selector = `.${classes.join('.')}`;
        const isUnique = document.querySelectorAll(selector).length === 1;

        return {
            type: 'class',
            selector,
            confidence: {
                score: isUnique ? 75 : 50,
                factors: [
                    {
                        factor: 'CSS classes',
                        impact: 'positive',
                        weight: 0.6,
                        description: 'CSS classes provide moderate reliability'
                    }
                ],
                warnings: isUnique ? [] : ['Class combination is not unique on the page']
            },
            explanation: `Uses CSS classes "${classes.join(' ')}" for identification`,
            isUnique,
            isStable: true
        };
    }

    /**
     * Generate Name-based locator strategy
     */
    private generateNameLocator(_element: HTMLElement, nameValue: string): LocatorStrategy {
        const selector = `[name="${nameValue}"]`;
        const isUnique = document.querySelectorAll(selector).length === 1;

        return {
            type: 'name',
            selector,
            confidence: {
                score: isUnique ? 85 : 60,
                factors: [
                    {
                        factor: 'Name attribute',
                        impact: 'positive',
                        weight: 0.8,
                        description: 'Name attributes are reliable for form elements'
                    }
                ],
                warnings: isUnique ? [] : ['Name attribute is not unique on the page']
            },
            explanation: `Uses name attribute "${nameValue}" for identification`,
            isUnique,
            isStable: true
        };
    }

    /**
     * Generate Tag-based locator strategy
     */
    private generateTagLocator(element: HTMLElement): LocatorStrategy {
        const selector = element.tagName.toLowerCase();
        const isUnique = document.querySelectorAll(selector).length === 1;

        return {
            type: 'tag',
            selector,
            confidence: {
                score: isUnique ? 40 : 20,
                factors: [
                    {
                        factor: 'Tag name',
                        impact: 'negative',
                        weight: 0.2,
                        description: 'Tag names alone are rarely unique'
                    }
                ],
                warnings: ['Tag-based selectors are generally not reliable']
            },
            explanation: `Uses tag name "${selector}" for identification`,
            isUnique,
            isStable: false
        };
    }

    /**
     * Generate ARIA-based locator strategies
     */
    private generateAriaLocators(element: HTMLElement): LocatorStrategy[] {
        const strategies: LocatorStrategy[] = [];

        // Check for aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim()) {
            const selector = `[aria-label="${ariaLabel}"]`;
            const isUnique = document.querySelectorAll(selector).length === 1;

            strategies.push({
                type: 'aria',
                selector,
                confidence: {
                    score: isUnique ? 80 : 60,
                    factors: [
                        {
                            factor: 'ARIA label',
                            impact: 'positive',
                            weight: 0.7,
                            description: 'ARIA labels provide good accessibility-based identification'
                        }
                    ],
                    warnings: isUnique ? [] : ['ARIA label is not unique on the page']
                },
                explanation: `Uses ARIA label "${ariaLabel}" for identification`,
                isUnique,
                isStable: true
            });
        }

        // Check for role attribute
        const role = element.getAttribute('role');
        if (role && role.trim()) {
            const selector = `[role="${role}"]`;
            const isUnique = document.querySelectorAll(selector).length === 1;

            strategies.push({
                type: 'aria',
                selector,
                confidence: {
                    score: isUnique ? 60 : 30,
                    factors: [
                        {
                            factor: 'ARIA role',
                            impact: 'positive',
                            weight: 0.5,
                            description: 'ARIA roles provide semantic identification'
                        }
                    ],
                    warnings: isUnique ? [] : ['ARIA role is not unique on the page']
                },
                explanation: `Uses ARIA role "${role}" for identification`,
                isUnique,
                isStable: true
            });
        }

        return strategies;
    }
}