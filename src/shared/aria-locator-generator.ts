/**
 * @fileoverview ARIA accessibility locator generation engine
 * 
 * This module provides comprehensive ARIA (Accessible Rich Internet Applications)
 * locator generation capabilities for web elements. It detects ARIA attributes,
 * generates accessibility-friendly locators, and creates detailed ARIA snapshots
 * for accessibility analysis.
 * 
 * The generator prioritizes ARIA attributes based on their reliability and
 * uniqueness for element identification, following accessibility best practices.
 * 
 * Requirements Coverage:
 * - Requirement 4.2: ARIA attribute detection and accessibility-friendly locators
 * - Requirement 4.3: ARIA snapshot generation functionality
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import { LocatorStrategy, ConfidenceScore, ConfidenceFactor } from './data-models';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * ARIA snapshot containing comprehensive accessibility information
 */
export interface AriaSnapshot {
    element: string;
    ariaAttributes: Record<string, string>;
    accessibleName: string;
    accessibleDescription: string;
    role: string;
    states: string[];
    hierarchy: string[];
}

// ============================================================================
// ARIA LOCATOR GENERATOR CLASS
// ============================================================================

/**
 * Generator for ARIA accessibility locators and snapshots
 */
export class AriaLocatorGenerator {
  /**
     * Priority order for ARIA attributes (higher index = higher priority)
     */
  private readonly ARIA_ATTRIBUTE_PRIORITY = [
    'aria-hidden',
    'aria-expanded',
    'aria-pressed',
    'aria-selected',
    'aria-required',
    'aria-describedby',
    'aria-labelledby',
    'role',
    'aria-label'
  ];

  /**
     * Generates ARIA-based locator for an element
     * @param element - The DOM element to generate locator for
     * @returns LocatorStrategy or null if no ARIA attributes found
     */
  generateAriaLocator(element: HTMLElement): LocatorStrategy | null {
    if (!element) {
      throw new Error('Element cannot be null or undefined');
    }

    const ariaAttributes = this.extractAriaAttributes(element);
    if (Object.keys(ariaAttributes).length === 0) {
      return null;
    }

    // Find the best ARIA attribute to use for locator
    const bestAttribute = this.selectBestAriaAttribute(ariaAttributes);
    if (!bestAttribute) {
      return null;
    }

    const selector = `[${bestAttribute.name}="${bestAttribute.value}"]`;
    const isUnique = this.validateUniqueness(selector);
    const confidence = this.calculateAriaConfidence(bestAttribute, ariaAttributes, isUnique);

    return {
      type: 'aria',
      selector,
      confidence,
      explanation: `ARIA locator using ${bestAttribute.name} attribute`,
      isUnique,
      isStable: this.calculateStability(bestAttribute)
    };
  }

  /**
     * Generates all possible ARIA locator strategies for an element
     * @param element - The DOM element to generate locators for
     * @returns Array of LocatorStrategy objects sorted by confidence
     */
  generateAllAriaStrategies(element: HTMLElement): LocatorStrategy[] {
    if (!element) {
      throw new Error('Element cannot be null or undefined');
    }

    const ariaAttributes = this.extractAriaAttributes(element);
    const strategies: LocatorStrategy[] = [];

    for (const [name, value] of Object.entries(ariaAttributes)) {
      if (this.isValidAttributeValue(value)) {
        const selector = `[${name}="${value}"]`;
        const isUnique = this.validateUniqueness(selector);
        const confidence = this.calculateAriaConfidence(
          { name, value },
          ariaAttributes,
          isUnique
        );

        strategies.push({
          type: 'aria',
          selector,
          confidence,
          explanation: `ARIA locator using ${name} attribute`,
          isUnique,
          isStable: this.calculateStability({ name, value })
        });
      }
    }

    // Sort by confidence score (highest first)
    return strategies.sort((a, b) => b.confidence.score - a.confidence.score);
  }

  /**
     * Generates comprehensive ARIA snapshot for an element
     * @param element - The DOM element to analyze
     * @returns AriaSnapshot with detailed accessibility information
     */
  generateAriaSnapshot(element: HTMLElement): AriaSnapshot {
    if (!element) {
      throw new Error('Element cannot be null or undefined');
    }

    const ariaAttributes = this.extractAriaAttributes(element);
    const accessibleName = this.computeAccessibleName(element);
    const accessibleDescription = this.computeAccessibleDescription(element);
    const role = this.computeRole(element);
    const states = this.extractAriaStates(element);
    const hierarchy = this.buildRoleHierarchy(element);

    return {
      element: element.tagName.toLowerCase(),
      ariaAttributes,
      accessibleName,
      accessibleDescription,
      role,
      states,
      hierarchy
    };
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  /**
     * Extracts all ARIA attributes from an element
     */
  private extractAriaAttributes(element: HTMLElement): Record<string, string> {
    const attributes: Record<string, string> = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr.name.startsWith('aria-') || attr.name === 'role') {
        const value = attr.value.trim();
        if (value) {
          attributes[attr.name] = value;
        }
      }
    }

    return attributes;
  }

  /**
     * Selects the best ARIA attribute for locator generation
     */
  private selectBestAriaAttribute(attributes: Record<string, string>): { name: string; value: string } | null {
    for (const attrName of this.ARIA_ATTRIBUTE_PRIORITY.slice().reverse()) {
      if (attributes[attrName] && this.isValidAttributeValue(attributes[attrName])) {
        return { name: attrName, value: attributes[attrName] };
      }
    }
    return null;
  }

  /**
     * Validates if an attribute value is suitable for locator generation
     */
  private isValidAttributeValue(value: string): boolean {
    return value.trim().length > 0;
  }

  /**
     * Validates uniqueness of a selector
     */
  private validateUniqueness(selector: string): boolean {
    try {
      const elements = document.querySelectorAll(selector);
      return elements.length === 1;
    } catch (error) {
      // Store error for later use in confidence calculation
      this.lastValidationError = error;
      return false;
    }
  }

  private lastValidationError: any = null;

  /**
     * Calculates confidence score for ARIA locator
     */
  private calculateAriaConfidence(
    attribute: { name: string; value: string },
    _allAttributes: Record<string, string>,
    isUnique: boolean
  ): ConfidenceScore {
    const factors: ConfidenceFactor[] = [];
    const warnings: string[] = [];
    let score = 50; // Base score

    // Attribute-specific scoring
    if (attribute.name === 'aria-label') {
      score += 35;
      factors.push({
        factor: 'aria-label',
        impact: 'positive',
        weight: 0.35,
        description: 'aria-label provides descriptive text for accessibility'
      });
    } else if (attribute.name === 'role') {
      score += 10;
      factors.push({
        factor: 'role',
        impact: 'positive',
        weight: 0.10,
        description: 'role attribute defines element purpose'
      });
    } else if (attribute.name.startsWith('aria-')) {
      score += 5;
      factors.push({
        factor: attribute.name,
        impact: 'positive',
        weight: 0.05,
        description: `${attribute.name} provides accessibility context`
      });
    }

    // Uniqueness scoring
    if (isUnique) {
      score += 15;
      factors.push({
        factor: 'uniqueness',
        impact: 'positive',
        weight: 0.15,
        description: 'Selector matches only one element'
      });
    } else {
      score -= 20;
      factors.push({
        factor: 'ambiguity',
        impact: 'negative',
        weight: 0.20,
        description: 'Selector matches multiple elements'
      });
      warnings.push('Multiple elements found with same ARIA attributes');
    }

    // Generic attribute warning
    if (['aria-hidden', 'aria-expanded', 'aria-pressed'].includes(attribute.name)) {
      score -= 15;
      warnings.push('Generic ARIA attribute may not be reliable for locating');
    }

    // Add validation error warning if present
    if (this.lastValidationError) {
      warnings.push('Could not validate locator uniqueness');
      this.lastValidationError = null; // Reset for next use
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      warnings
    };
  }

  /**
     * Calculates stability score for ARIA attribute
     */
  private calculateStability(attribute: { name: string; value: string }): boolean {
    // aria-label and role are generally stable
    if (['aria-label', 'role'].includes(attribute.name)) {
      return true;
    }

    // State attributes are less stable
    if (['aria-pressed', 'aria-expanded', 'aria-selected'].includes(attribute.name)) {
      return false;
    }

    return true;
  }

  /**
     * Computes accessible name for an element
     */
  private computeAccessibleName(element: HTMLElement): string {
    // Check aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) {
        return labelElement.textContent?.trim() || '';
      }
    }

    // Check associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return label.textContent?.trim() || '';
      }
    }

    // Fallback to text content
    return element.textContent?.trim() || '';
  }

  /**
     * Computes accessible description for an element
     */
  private computeAccessibleDescription(element: HTMLElement): string {
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const descElement = document.getElementById(describedBy);
      if (descElement) {
        return descElement.textContent?.trim() || '';
      }
    }
    return '';
  }

  /**
     * Computes the role of an element
     */
  private computeRole(element: HTMLElement): string {
    const explicitRole = element.getAttribute('role');
    if (explicitRole) {
      return explicitRole;
    }

    // Implicit roles based on tag name
    const tagName = element.tagName.toLowerCase();
    const implicitRoles: Record<string, string> = {
      'button': 'button',
      'a': 'link',
      'input': this.getInputRole(element as HTMLInputElement),
      'textarea': 'textbox',
      'select': 'combobox',
      'nav': 'navigation',
      'main': 'main',
      'header': 'banner',
      'footer': 'contentinfo',
      'aside': 'complementary',
      'section': 'region',
      'article': 'article',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading',
      'ul': 'list',
      'ol': 'list',
      'li': 'listitem'
    };

    return implicitRoles[tagName] || 'generic';
  }

  /**
     * Gets the implicit role for input elements based on type
     */
  private getInputRole(input: HTMLInputElement): string {
    const type = (input.type || 'text').toLowerCase();
    const inputRoles: Record<string, string> = {
      'button': 'button',
      'submit': 'button',
      'reset': 'button',
      'checkbox': 'checkbox',
      'radio': 'radio',
      'range': 'slider',
      'email': 'textbox',
      'password': 'textbox',
      'search': 'searchbox',
      'tel': 'textbox',
      'text': 'textbox',
      'url': 'textbox'
    };
    return inputRoles[type] || 'textbox';
  }

  /**
     * Extracts ARIA states from an element
     */
  private extractAriaStates(element: HTMLElement): string[] {
    const states: string[] = [];

    if (element.getAttribute('aria-required') === 'true' || element.hasAttribute('required')) {
      states.push('required');
    }
    if (element.getAttribute('aria-disabled') === 'true') {
      states.push('disabled');
    }
    if (element.getAttribute('aria-expanded') === 'true') {
      states.push('expanded');
    }
    if (element.getAttribute('aria-pressed') === 'true') {
      states.push('pressed');
    }
    if (element.getAttribute('aria-selected') === 'true') {
      states.push('selected');
    }
    if (element.getAttribute('aria-hidden') === 'true') {
      states.push('hidden');
    }

    return states;
  }

  /**
     * Builds role hierarchy for an element
     */
  private buildRoleHierarchy(element: HTMLElement): string[] {
    const hierarchy: string[] = [];
    let current: Element | null = element.parentElement;

    while (current) {
      const role = this.computeRole(current as HTMLElement);
      if (role !== 'generic') {
        hierarchy.unshift(role);
      }
      current = current.parentElement;
    }

    return hierarchy;
  }
}