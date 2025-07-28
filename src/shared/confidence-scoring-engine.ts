/**
 * @fileoverview Confidence Scoring Engine
 * 
 * This module implements a unified confidence scoring algorithm that works across
 * all locator types (CSS, XPath, ID, Class, Name, Tag, ARIA). It provides
 * comprehensive confidence assessment with detailed factor analysis and warnings.
 * 
 * The engine evaluates locators based on multiple criteria:
 * - Uniqueness: Whether the locator uniquely identifies the element
 * - Stability: Likelihood that the locator will survive DOM changes
 * - Type reliability: Inherent reliability of the locator type
 * - Pattern analysis: Detection of auto-generated or fragile patterns
 * 
 * Requirements covered:
 * - 3.1: Confidence scoring with detailed explanations
 * - 3.2: Confidence scoring for locator reliability
 * - 3.3: Warnings for low confidence scores
 * - 3.4: Uniqueness validation and stability assessment
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import { LocatorStrategy, ConfidenceScore, ConfidenceFactor, LocatorType } from './data-models';

/**
 * Unified Confidence Scoring Engine
 * 
 * Provides comprehensive confidence assessment for all locator types with
 * detailed factor analysis, pattern detection, and stability assessment.
 */
export class ConfidenceScoringEngine {
  /**
     * Calculates confidence score for a locator strategy
     * 
     * @param strategy - The locator strategy to evaluate
     * @param element - The target DOM element
     * @param document - The document context for validation
     * @returns Updated ConfidenceScore with detailed analysis
     */
  calculateConfidenceScore(
    strategy: LocatorStrategy,
    element: HTMLElement,
    document: Document
  ): ConfidenceScore {
    if (!strategy) {
      throw new Error('Locator strategy cannot be null or undefined');
    }

    if (!element) {
      throw new Error('Element cannot be null or undefined');
    }

    if (!document) {
      throw new Error('Document cannot be null or undefined');
    }

    const factors: ConfidenceFactor[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Handle edge cases
    if (!strategy.selector || strategy.selector.trim() === '') {
      warnings.push('Empty selector provided');
      return {
        score: 0,
        factors: [{
          factor: 'Empty selector',
          impact: 'negative',
          weight: 1.0,
          description: 'No selector provided'
        }],
        warnings
      };
    }

    // Handle unknown locator types
    const validTypes: LocatorType[] = ['css', 'xpath', 'id', 'class', 'name', 'tag', 'aria'];
    if (!validTypes.includes(strategy.type)) {
      warnings.push(`Unknown locator type: ${strategy.type}`);
    }

    // Uniqueness factor (40% weight) - this might throw DOM errors
    score += this.calculateUniquenessScore(strategy, factors, warnings);

    // Stability factor (35% weight)
    const stabilityScore = this.assessStability(strategy.type, strategy.selector);
    const stabilityContribution = (stabilityScore / 100) * 35;
    score += stabilityContribution;

    factors.push({
      factor: 'Stability assessment',
      impact: stabilityScore > 60 ? 'positive' : 'negative',
      weight: 0.35,
      description: `Selector stability score: ${stabilityScore}/100`
    });

    // Type-specific reliability factor (15% weight)
    score += this.calculateTypeReliabilityScore(strategy.type, factors);

    // Pattern analysis factor (10% weight)
    score += this.calculatePatternScore(strategy, factors, warnings);

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      factors,
      warnings
    };
  }

  /**
     * Assesses the stability of a locator based on its type and value
     * 
     * @param type - The locator type
     * @param selector - The selector value
     * @returns Stability score from 0-100
     */
  assessStability(type: LocatorType, selector: string): number {
    switch (type) {
    case 'id':
      return this.assessIdStability(selector);
    case 'class':
      return this.assessClassStability(selector);
    case 'name':
      return this.assessNameStability(selector);
    case 'tag':
      return this.assessTagStability(selector);
    case 'css':
      return this.assessCssStability(selector);
    case 'xpath':
      return this.assessXPathStability(selector);
    case 'aria':
      return this.assessAriaStability(selector);
    default:
      return 50; // Default stability
    }
  }

  /**
     * Detects patterns in a locator that may affect reliability
     * 
     * @param type - The locator type
     * @param selector - The selector value
     * @returns Array of detected pattern names
     */
  detectPatterns(type: LocatorType, selector: string): string[] {
    const patterns: string[] = [];

    switch (type) {
    case 'id':
      patterns.push(...this.detectIdPatterns(selector));
      break;
    case 'class':
      patterns.push(...this.detectClassPatterns(selector));
      break;
    case 'xpath':
      patterns.push(...this.detectXPathPatterns(selector));
      break;
    case 'css':
      patterns.push(...this.detectCssPatterns(selector));
      break;
    case 'aria':
      patterns.push(...this.detectAriaPatterns(selector));
      break;
    }

    return patterns;
  }

  /**
     * Generates human-readable explanation for a locator strategy
     * 
     * @param strategy - The locator strategy to explain
     * @returns Human-readable explanation string
     */
  generateExplanation(strategy: LocatorStrategy): string {
    let explanation = '';

    // Type-specific introduction
    switch (strategy.type) {
    case 'id':
      explanation = 'ID selector provides high reliability when unique. ';
      break;
    case 'class':
      explanation = 'Class selector offers moderate reliability. ';
      break;
    case 'name':
      explanation = 'Name attribute selector is reliable for form elements. ';
      break;
    case 'tag':
      explanation = 'Tag selector has low reliability due to commonality. ';
      break;
    case 'css':
      explanation = 'CSS selector reliability depends on specificity. ';
      break;
    case 'xpath':
      explanation = 'XPath selector reliability varies by expression type. ';
      break;
    case 'aria':
      explanation = 'ARIA selector provides semantic accessibility benefits. ';
      break;
    }

    // Confidence level assessment
    if (strategy.confidence.score >= 80) {
      explanation += 'This selector has high reliability and should be stable. ';
    } else if (strategy.confidence.score >= 60) {
      explanation += 'This selector has moderate reliability. ';
    } else {
      explanation += 'This selector has low reliability and may be fragile. ';
    }

    // Uniqueness status
    if (strategy.isUnique) {
      explanation += 'The selector is unique on the page. ';
    } else {
      explanation += 'Warning: The selector matches multiple elements. ';
    }

    // Stability status
    if (strategy.isStable) {
      explanation += 'The selector appears stable across page changes.';
    } else {
      explanation += 'Warning: The selector may be unstable with page changes.';
    }

    // Add specific warnings
    if (strategy.confidence.warnings.length > 0) {
      explanation += ' Additional warnings: ' + strategy.confidence.warnings.join(', ') + '.';
    }

    return explanation.trim();
  }

  /**
     * Compares two locator strategies for ranking purposes
     * 
     * @param a - First strategy
     * @param b - Second strategy
     * @returns Negative if a should rank higher, positive if b should rank higher
     */
  compareStrategies(a: LocatorStrategy, b: LocatorStrategy): number {
    // Type hierarchy (lower number = higher priority)
    const typeHierarchy: Record<LocatorType, number> = {
      'id': 1,
      'aria': 2,
      'name': 3,
      'css': 4,
      'class': 5,
      'xpath': 6,
      'tag': 7
    };

    // First compare by type hierarchy
    const typeComparison = typeHierarchy[a.type] - typeHierarchy[b.type];
    if (typeComparison !== 0) {
      return typeComparison;
    }

    // Then by uniqueness
    if (a.isUnique && !b.isUnique) return -1;
    if (!a.isUnique && b.isUnique) return 1;

    // Finally by confidence score
    return b.confidence.score - a.confidence.score;
  }

  // Private helper methods

  private calculateUniquenessScore(
    strategy: LocatorStrategy,
    factors: ConfidenceFactor[],
    warnings: string[]
  ): number {
    if (strategy.isUnique) {
      factors.push({
        factor: 'Uniqueness',
        impact: 'positive',
        weight: 0.4,
        description: 'Selector uniquely identifies the element'
      });
      return 40;
    } else {
      factors.push({
        factor: 'Non-unique selector',
        impact: 'negative',
        weight: 0.4,
        description: 'Selector matches multiple elements'
      });
      warnings.push('Selector matches multiple elements');
      return 0;
    }
  }

  private calculateTypeReliabilityScore(type: LocatorType, factors: ConfidenceFactor[]): number {
    const typeScores: Record<LocatorType, { score: number; description: string; factorName: string }> = {
      'id': { score: 15, description: 'ID selectors are highly reliable', factorName: 'ID selector' },
      'aria': { score: 12, description: 'ARIA selectors provide semantic reliability', factorName: 'ARIA selector' },
      'name': { score: 10, description: 'Name selectors are reliable for form elements', factorName: 'Name attribute' },
      'css': { score: 8, description: 'CSS selectors have moderate reliability', factorName: 'CSS selector' },
      'class': { score: 6, description: 'Class selectors have moderate reliability', factorName: 'Class selector' },
      'xpath': { score: 4, description: 'XPath selectors vary in reliability', factorName: 'XPath selector' },
      'tag': { score: -5, description: 'Tag selectors have low reliability', factorName: 'Tag selector' }
    };

    const typeInfo = typeScores[type] || { score: 0, description: 'Unknown selector type', factorName: 'Unknown selector' };

    factors.push({
      factor: typeInfo.factorName,
      impact: typeInfo.score > 0 ? 'positive' : 'negative',
      weight: 0.15,
      description: typeInfo.description
    });

    return typeInfo.score;
  }

  private calculatePatternScore(
    strategy: LocatorStrategy,
    factors: ConfidenceFactor[],
    warnings: string[]
  ): number {
    const patterns = this.detectPatterns(strategy.type, strategy.selector);
    let score = 0;

    for (const pattern of patterns) {
      switch (pattern) {
      case 'auto-generated':
        factors.push({
          factor: 'Auto-generated pattern',
          impact: 'negative',
          weight: 0.1,
          description: 'Selector appears to be auto-generated'
        });
        warnings.push('Contains auto-generated class names that may change');
        score -= 10;
        break;
      case 'position-based':
        factors.push({
          factor: 'Position-based selector',
          impact: 'negative',
          weight: 0.1,
          description: 'Selector relies on element position'
        });
        warnings.push('Uses position-based selectors that may break with DOM changes');
        score -= 10;
        break;
      case 'semantic':
        factors.push({
          factor: 'Semantic pattern',
          impact: 'positive',
          weight: 0.05,
          description: 'Selector uses semantic naming'
        });
        score += 5;
        break;
      case 'accessibility-friendly':
        factors.push({
          factor: 'Accessibility-friendly',
          impact: 'positive',
          weight: 0.1,
          description: 'Selector supports accessibility'
        });
        score += 10;
        break;
      }
    }

    return score;
  }



  // Stability assessment methods

  private assessIdStability(id: string): number {
    if (this.isAutoGeneratedId(id)) return 30;
    if (this.isUuidPattern(id)) return 25;
    if (this.isSemanticId(id)) return 95;
    return 70;
  }

  private assessClassStability(className: string): number {
    if (this.isCssInJsClass(className)) return 25;
    if (this.isUtilityClass(className)) return 65;
    if (this.isSemanticClass(className)) return 85;
    if (this.isBemClass(className)) return 80;
    return 60;
  }

  private assessNameStability(name: string): number {
    if (this.isGenericName(name)) return 40;
    if (this.isSemanticName(name)) return 90;
    return 70;
  }

  private assessTagStability(tagName: string): number {
    const semanticTags = ['main', 'nav', 'header', 'footer', 'aside', 'section', 'article'];
    const formTags = ['form', 'fieldset', 'legend'];
    const inputTags = ['input', 'select', 'textarea', 'button'];
    const genericTags = ['div', 'span', 'p', 'a'];

    if (semanticTags.includes(tagName)) return 75;
    if (formTags.includes(tagName)) return 70;
    if (inputTags.includes(tagName)) return 60;
    if (genericTags.includes(tagName)) return 40;
    return 55;
  }

  private assessCssStability(selector: string): number {
    if (selector.includes('#')) return 95; // ID-based
    if (selector.includes('[')) return 70; // Attribute-based
    if (selector.includes('.') && !this.hasAutoGeneratedClasses(selector)) return 75;
    if (this.hasAutoGeneratedClasses(selector)) return 25;
    if (selector.includes(':nth-child')) return 15; // Position-based
    return 50;
  }

  private assessXPathStability(xpath: string): number {
    if (xpath.includes('[@id=')) return 95;
    if (xpath.includes('[@name=') || xpath.includes('[@type=')) return 75;
    if (xpath.includes('contains(@class')) return xpath.match(/\[\d+\]/) ? 35 : 65;
    if (xpath.includes('text()=')) return 55;
    if (xpath.startsWith('/html/') && xpath.match(/\[\d+\]/)) return 15;
    if (xpath.match(/\[\d+\]/)) return 35;
    return 50;
  }

  private assessAriaStability(selector: string): number {
    // ARIA selectors are generally stable as they're semantic
    if (selector.includes('aria-label')) return 85;
    if (selector.includes('role=')) return 80;
    if (selector.includes('aria-')) return 75;
    return 70;
  }

  // Pattern detection methods

  private detectIdPatterns(id: string): string[] {
    const patterns: string[] = [];
    if (this.isAutoGeneratedId(id)) patterns.push('auto-generated');
    if (this.isUuidPattern(id)) patterns.push('uuid');
    if (this.isSemanticId(id)) patterns.push('semantic');
    return patterns;
  }

  private detectClassPatterns(className: string): string[] {
    const patterns: string[] = [];
    if (this.isCssInJsClass(className)) patterns.push('auto-generated');
    if (this.isUtilityClass(className)) patterns.push('utility');
    if (this.isBemClass(className)) patterns.push('bem');
    if (this.isSemanticClass(className)) patterns.push('semantic');
    return patterns;
  }

  private detectXPathPatterns(xpath: string): string[] {
    const patterns: string[] = [];
    if (xpath.match(/\[\d+\]/)) patterns.push('position-based');
    if (xpath.startsWith('/html/')) patterns.push('absolute-path');
    if (xpath.includes('[@aria-') || xpath.includes('[@role=')) patterns.push('accessibility-friendly');
    return patterns;
  }

  private detectAriaPatterns(selector: string): string[] {
    const patterns: string[] = [];
    if (selector.includes('aria-') || selector.includes('role=')) {
      patterns.push('accessibility-friendly');
    }
    return patterns;
  }

  private detectCssPatterns(selector: string): string[] {
    const patterns: string[] = [];
    if (this.hasAutoGeneratedClasses(selector)) patterns.push('auto-generated');
    if (selector.includes(':nth-child')) patterns.push('position-based');
    return patterns;
  }

  // Pattern matching helper methods

  private isAutoGeneratedId(id: string): boolean {
    return /^(auto|gen|temp|tmp)-?\d+/.test(id) || /\d{6,}/.test(id);
  }

  private isUuidPattern(id: string): boolean {
    return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
  }

  private isSemanticId(id: string): boolean {
    return /^[a-z]+(-[a-z]+)*$/.test(id) && id.length > 3;
  }

  private isCssInJsClass(className: string): boolean {
    return /^css-[a-z0-9]+$/i.test(className) || /^[a-z]+-[0-9a-f]{6,}$/i.test(className);
  }

  private isUtilityClass(className: string): boolean {
    return /^(mt|mb|ml|mr|pt|pb|pl|pr|m|p)-\d+$/.test(className) ||
            /^(text|bg|border)-(xs|sm|md|lg|xl|\d+)$/.test(className);
  }

  private isSemanticClass(className: string): boolean {
    return /^[a-z]+(-[a-z]+)*$/.test(className) && className.length > 3;
  }

  private isBemClass(className: string): boolean {
    return /^[a-z]+(__[a-z]+)?(--[a-z]+)?$/.test(className);
  }

  private isGenericName(name: string): boolean {
    return /^(field|input|element)\d*$/i.test(name);
  }

  private isSemanticName(name: string): boolean {
    return /^[a-z]+(-[a-z]+)*$/.test(name) && name.length > 3;
  }

  private hasAutoGeneratedClasses(selector: string): boolean {
    return /css-[a-z0-9]+/i.test(selector) || /[a-z]+-[0-9a-f]{6,}/i.test(selector);
  }
}