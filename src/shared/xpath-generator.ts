/**
 * @fileoverview XPath Expression Generation Engine
 * 
 * This module implements XPath expression generation for DOM elements,
 * including position-based selectors, attribute-based selectors, and
 * XPath optimization with uniqueness validation.
 * 
 * The generator follows a priority-based approach:
 * 1. ID-based XPath (highest reliability) - //button[@id="submit"]
 * 2. Attribute-based XPath (name, type, data-* attributes) - //input[@name="email"]
 * 3. Class-based XPath (with contains() functions) - //div[contains(@class, "container")]
 * 4. Text content-based XPath - //button[text()="Click Me"]
 * 5. Position-based XPath (parent/child relationships) - //div[@class="parent"]/button[2]
 * 6. Absolute XPath (fallback) - //span
 * 
 * XPath expressions are optimized for:
 * - Uniqueness: Validated against DOM to ensure single element match
 * - Stability: Scored based on likelihood to survive DOM changes
 * - Performance: Shorter expressions preferred when equally reliable
 * 
 * Requirements covered:
 * - 2.1: XPath locator generation strategy
 * - 3.2: Confidence scoring for locator reliability
 * - 3.4: Uniqueness validation and stability assessment
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import { LocatorStrategy, ConfidenceScore, ConfidenceFactor } from './data-models';

/**
 * XPath Expression Generation Engine
 * 
 * Generates XPath expressions for DOM elements using various strategies:
 * - ID-based XPath (highest priority)
 * - Attribute-based XPath
 * - Class-based XPath with contains() functions
 * - Text content-based XPath
 * - Position-based XPath
 * - Absolute XPath (fallback)
 */
export class XPathGenerator {
  /**
         * Generates an XPath expression for the given element
         * 
         * @param element - The DOM element to generate XPath for
         * @param document - The document context for validation
         * @returns LocatorStrategy with XPath expression and confidence information
         */
  generateXPath(element: HTMLElement, document: Document): LocatorStrategy {
    if (!element) {
      throw new Error('Element cannot be null or undefined');
    }

    if (!document) {
      throw new Error('Document cannot be null or undefined');
    }

    // Try different XPath strategies in order of preference
    let xpath = this.tryIdXPath(element);

    if (!xpath) {
      xpath = this.tryAttributeXPath(element);
    }

    if (!xpath) {
      xpath = this.tryClassXPath(element);
    }

    if (!xpath) {
      xpath = this.tryTextXPath(element);
    }

    if (!xpath) {
      xpath = this.tryPositionXPath(element);
    }

    if (!xpath) {
      xpath = this.tryAbsoluteXPath(element);
    }

    // Validate uniqueness
    const isUnique = this.validateXPathUniqueness(xpath, element, document);

    // Calculate stability score
    const stabilityScore = this.calculateXPathStability(xpath);
    const isStable = stabilityScore > 60;

    // Generate confidence score
    const confidence = this.generateXPathConfidence(xpath, isUnique, stabilityScore);

    // Generate explanation
    const explanation = this.generateExplanation(xpath, isUnique, isStable);

    return {
      type: 'xpath',
      selector: xpath,
      confidence,
      explanation,
      isUnique,
      isStable
    };
  }

  /**
         * Validates if an XPath expression uniquely identifies the target element
         * 
         * @param xpath - XPath expression to validate
         * @param targetElement - The element that should be uniquely selected
         * @param document - Document context for XPath evaluation
         * @returns true if XPath is unique, false otherwise
         */
  validateXPathUniqueness(xpath: string, targetElement: HTMLElement, document: Document): boolean {
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );

      return result.snapshotLength === 1 && result.snapshotItem(0) === targetElement;
    } catch (error) {
      return false;
    }
  }

  /**
         * Calculates stability score for an XPath expression
         * 
         * @param xpath - XPath expression to evaluate
         * @returns Stability score from 0-100
         */
  calculateXPathStability(xpath: string): number {
    let score = 50; // Base score

    // ID-based XPath is most stable
    if (xpath.includes('[@id=')) {
      score = 95;
    }
    // Attribute-based XPath is fairly stable
    else if (xpath.includes('[@name=') || xpath.includes('[@type=') || xpath.includes('[@data-')) {
      score = 75;
    }
    // Class-based XPath is moderately stable (but check for position)
    else if (xpath.includes('contains(@class')) {
      score = xpath.match(/\[\d+\]/) ? 35 : 65; // Lower score if position-based
    }
    // Text-based XPath is less stable
    else if (xpath.includes('text()=')) {
      score = 55;
    }
    // Absolute position XPath is very unstable
    else if (xpath.startsWith('/html/') && xpath.match(/\[\d+\]/)) {
      score = 15;
    }
    // Position-based XPath is unstable
    else if (xpath.match(/\[\d+\]/)) {
      score = 35;
    }
    // Absolute XPath is very unstable
    else if (xpath.startsWith('/html/')) {
      score = 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
         * Generates confidence score with detailed factors and warnings
         * 
         * @param xpath - XPath expression to evaluate
         * @param isUnique - Whether XPath uniquely identifies element
         * @param stabilityScore - Stability score of the XPath
         * @returns ConfidenceScore with breakdown
         */
  generateXPathConfidence(xpath: string, isUnique: boolean, stabilityScore: number): ConfidenceScore {
    const factors: ConfidenceFactor[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Uniqueness factor (40% weight)
    if (isUnique) {
      factors.push({
        factor: 'Uniqueness',
        impact: 'positive',
        weight: 0.4,
        description: 'XPath uniquely identifies the element'
      });
      score += 40;
    } else {
      factors.push({
        factor: 'Non-unique XPath',
        impact: 'negative',
        weight: 0.4,
        description: 'XPath matches multiple elements'
      });
      warnings.push('XPath matches multiple elements');
    }

    // Stability factor (40% weight)
    const stabilityContribution = (stabilityScore / 100) * 40;
    score += stabilityContribution;

    // XPath type factors (20% weight)
    if (xpath.includes('[@id=')) {
      factors.push({
        factor: 'ID-based XPath',
        impact: 'positive',
        weight: 0.2,
        description: 'ID-based XPath expressions are highly reliable'
      });
      score += 20;
    } else if (xpath.includes('[@name=') || xpath.includes('[@type=') || xpath.includes('[@data-')) {
      factors.push({
        factor: 'Attribute-based XPath',
        impact: 'positive',
        weight: 0.15,
        description: 'Attribute-based XPath expressions are moderately reliable'
      });
      score += 15;
    } else if (xpath.includes('contains(@class')) {
      factors.push({
        factor: 'Class-based XPath',
        impact: 'positive',
        weight: 0.1,
        description: 'Class-based XPath expressions have moderate reliability'
      });
      score += 10;
    } else if (xpath.includes('text()=')) {
      factors.push({
        factor: 'Text-based XPath',
        impact: 'positive',
        weight: 0.05,
        description: 'Text-based XPath expressions have limited reliability'
      });
      score += 5;
    }

    // Position-based XPath penalty
    if (xpath.match(/\[\d+\]/)) {
      factors.push({
        factor: 'Position-based XPath',
        impact: 'negative',
        weight: 0.2,
        description: 'Position-based XPath expressions are fragile'
      });
      score -= 20;
    }

    // Tag-only XPath penalty (fallback)
    if (!xpath.includes('[@') && !xpath.includes('contains(@') && !xpath.includes('text()=') && !xpath.match(/\[\d+\]/)) {
      factors.push({
        factor: 'Tag-only XPath',
        impact: 'negative',
        weight: 0.21,
        description: 'Tag-only XPath expressions have low reliability'
      });
      score -= 21;
    }

    // Position-based XPath warning
    if (xpath.match(/\[\d+\]/)) {
      warnings.push('Uses position-based selectors that may break with DOM changes');
    }

    // Absolute XPath warning
    if (xpath.startsWith('/html/')) {
      warnings.push('Uses absolute path that is highly fragile');
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      factors,
      warnings
    };
  }

  /**
         * Tries to generate an ID-based XPath
         */
  private tryIdXPath(element: HTMLElement): string | null {
    if (element.id && element.id.trim()) {
      const tagName = element.tagName.toLowerCase();
      return `//${tagName}[@id="${element.id}"]`;
    }
    return null;
  }

  /**
         * Tries to generate an attribute-based XPath
         */
  private tryAttributeXPath(element: HTMLElement): string | null {
    const tagName = element.tagName.toLowerCase();

    // Priority attributes for different element types
    const priorityAttributes = ['name', 'type', 'data-testid', 'data-test', 'role'];

    for (const attr of priorityAttributes) {
      const value = element.getAttribute(attr);
      if (value && value.trim()) {
        return `//${tagName}[@${attr}="${value}"]`;
      }
    }

    return null;
  }

  /**
         * Tries to generate a class-based XPath
         */
  private tryClassXPath(element: HTMLElement): string | null {
    if (element.className && element.className.trim()) {
      const classes = element.className.trim().split(/\s+/);
      const tagName = element.tagName.toLowerCase();

      if (classes.length === 1) {
        return `//${tagName}[contains(@class, "${classes[0]}")]`;
      } else {
        const classConditions = classes.map(cls => `contains(@class, "${cls}")`).join(' and ');
        return `//${tagName}[${classConditions}]`;
      }
    }
    return null;
  }

  /**
         * Tries to generate a text-based XPath
         */
  private tryTextXPath(element: HTMLElement): string | null {
    if (element.textContent && element.textContent.trim()) {
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent.trim();
      return `//${tagName}[text()="${text}"]`;
    }
    return null;
  }

  /**
         * Tries to generate a position-based XPath
         */
  private tryPositionXPath(element: HTMLElement): string | null {
    const parent = element.parentElement;
    if (!parent) {
      return `//${element.tagName.toLowerCase()}`;
    }

    // Find element position among siblings of same tag
    const siblings = Array.from(parent.children).filter(
      child => child.tagName === element.tagName
    );
    const position = siblings.indexOf(element) + 1; // XPath is 1-indexed

    const tagName = element.tagName.toLowerCase();
    const parentXPath = this.tryClassXPath(parent) || this.tryIdXPath(parent) || parent.tagName.toLowerCase();

    // Remove leading // from parent XPath if it exists
    const cleanParentXPath = parentXPath.startsWith('//') ? parentXPath.substring(2) : parentXPath;

    return `//${cleanParentXPath}/${tagName}[${position}]`;
  }

  /**
         * Tries to generate an absolute XPath (fallback)
         */
  private tryAbsoluteXPath(element: HTMLElement): string {
    return `//${element.tagName.toLowerCase()}`;
  }

  /**
         * Generates human-readable explanation for the XPath
         */
  private generateExplanation(xpath: string, isUnique: boolean, isStable: boolean): string {
    let explanation = `Generated XPath expression: ${xpath}. `;

    if (xpath.includes('[@id=')) {
      explanation += 'Uses element ID for high reliability. ';
    } else if (xpath.includes('[@name=') || xpath.includes('[@type=')) {
      explanation += 'Uses element attributes for moderate reliability. ';
    } else if (xpath.includes('contains(@class')) {
      explanation += 'Uses CSS classes for identification. ';
    } else if (xpath.includes('text()=')) {
      explanation += 'Uses text content for identification. ';
    } else if (xpath.match(/\[\d+\]/)) {
      explanation += 'Uses element position for identification. ';
    } else {
      explanation += 'Uses tag name as fallback selector. ';
    }

    if (!isUnique) {
      explanation += 'Warning: XPath may match multiple elements. ';
    }

    if (!isStable) {
      explanation += 'Warning: XPath may be unstable across page changes.';
    }

    return explanation.trim();
  }
}