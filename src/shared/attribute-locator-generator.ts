/**
 * @fileoverview Attribute-Based Locator Generation Engine
 * 
 * This module implements locator generation for ID, Class, Name, and Tag
 * attributes with confidence scoring based on attribute stability and uniqueness.
 * 
 * The generator provides individual locator strategies:
 * - ID locators (highest reliability) - element.id
 * - Class locators (moderate reliability) - element.className
 * - Name locators (form elements) - element.name
 * - Tag locators (fallback) - element.tagName
 * 
 * Each strategy includes:
 * - Uniqueness validation using native DOM methods
 * - Stability assessment based on attribute patterns
 * - Confidence scoring with detailed factor analysis
 * - Auto-generated pattern detection and warnings
 * 
 * Requirements covered:
 * - 2.1: ID, Class, Name, and Tag locator generation strategies
 * - 3.2: Confidence scoring for locator reliability
 * - 3.4: Uniqueness validation and stability assessment
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import { LocatorStrategy, ConfidenceScore, ConfidenceFactor } from './data-models';

/**
 * Attribute-Based Locator Generation Engine
 * 
 * Generates locators for DOM elements using ID, Class, Name, and Tag attributes.
 * Each locator type has specific validation and confidence scoring algorithms.
 */
export class AttributeLocatorGenerator {
  private _lastValidationError: any = null;

  /**
       * Generates an ID-based locator for the given element
       * 
       * @param element - The DOM element to generate ID locator for
       * @param document - The document context for validation
       * @returns LocatorStrategy with ID locator or null if no ID
       */
  generateIdLocator(element: HTMLElement, document: Document): LocatorStrategy | null {
    if (!element) {
      throw new Error('Element cannot be null or undefined');
    }

    if (!document) {
      throw new Error('Document cannot be null or undefined');
    }

    if (!element.id || !element.id.trim()) {
      return null;
    }

    const selector = element.id;
    const isUnique = this.validateIdUniqueness(selector, element, document);
    const stabilityScore = this.assessAttributeStability('id', selector);
    const isStable = stabilityScore > 80;
    const confidence = this.generateConfidenceScore('id', selector, isUnique, stabilityScore);
    const explanation = this.generateExplanation('id', selector, isUnique, isStable);

    return {
      type: 'id',
      selector,
      confidence,
      explanation,
      isUnique,
      isStable
    };
  }

  /**
       * Generates a class-based locator for the given element
       * 
       * @param element - The DOM element to generate class locator for
       * @param document - The document context for validation
       * @returns LocatorStrategy with class locator or null if no classes
       */
  generateClassLocator(element: HTMLElement, document: Document): LocatorStrategy | null {
    if (!element) {
      throw new Error('Element cannot be null or undefined');
    }

    if (!document) {
      throw new Error('Document cannot be null or undefined');
    }

    if (!element.className || !element.className.trim()) {
      return null;
    }

    // Find the best class to use (prefer unique, semantic classes)
    const classes = element.className.trim().split(/\s+/);
    const bestClassInfo = this.findBestClassWithInfo(classes, document);

    if (!bestClassInfo) {
      return null;
    }

    const selector = bestClassInfo.className;
    const isUnique = bestClassInfo.isUnique;
    const stabilityScore = this.assessAttributeStability('class', selector);
    const isStable = stabilityScore > 70;
    const confidence = this.generateConfidenceScore('class', selector, isUnique, stabilityScore);
    const explanation = this.generateExplanation('class', selector, isUnique, isStable);

    return {
      type: 'class',
      selector,
      confidence,
      explanation,
      isUnique,
      isStable
    };
  }

  /**
       * Generates a name-based locator for the given element
       * 
       * @param element - The DOM element to generate name locator for
       * @param document - The document context for validation
       * @returns LocatorStrategy with name locator or null if not applicable
       */
  generateNameLocator(element: HTMLElement, document: Document): LocatorStrategy | null {
    if (!element) {
      throw new Error('Element cannot be null or undefined');
    }

    if (!document) {
      throw new Error('Document cannot be null or undefined');
    }

    // Name attribute is only meaningful for form elements
    const FORM_ELEMENTS = ['input', 'select', 'textarea', 'button', 'fieldset', 'form'];
    if (!FORM_ELEMENTS.includes(element.tagName.toLowerCase())) {
      return null;
    }

    const name = element.getAttribute('name');
    if (!name || !name.trim()) {
      return null;
    }

    const selector = name;
    const isUnique = this.validateNameUniqueness(selector, element, document);
    const stabilityScore = this.assessAttributeStability('name', selector);
    const isStable = stabilityScore > 80;
    const confidence = this.generateConfidenceScore('name', selector, isUnique, stabilityScore);
    const explanation = this.generateExplanation('name', selector, isUnique, isStable);

    return {
      type: 'name',
      selector,
      confidence,
      explanation,
      isUnique,
      isStable
    };
  }

  /**
       * Generates a tag-based locator for the given element
       * 
       * @param element - The DOM element to generate tag locator for
       * @param document - The document context for validation
       * @returns LocatorStrategy with tag locator
       */
  generateTagLocator(element: HTMLElement, document: Document): LocatorStrategy {
    if (!element) {
      throw new Error('Element cannot be null or undefined');
    }

    if (!document) {
      throw new Error('Document cannot be null or undefined');
    }

    const selector = element.tagName.toLowerCase();
    const isUnique = this.validateTagUniqueness(selector, element, document);
    const stabilityScore = this.assessAttributeStability('tag', selector);
    const isStable = stabilityScore > 60;
    const confidence = this.generateConfidenceScore('tag', selector, isUnique, stabilityScore);
    const explanation = this.generateExplanation('tag', selector, isUnique, isStable);

    return {
      type: 'tag',
      selector,
      confidence,
      explanation,
      isUnique,
      isStable
    };
  }

  /**
       * Generates all applicable locators for an element, sorted by confidence
       * 
       * @param element - The DOM element to generate locators for
       * @param document - The document context for validation
       * @returns Array of LocatorStrategy objects sorted by confidence score
       */
  generateAllLocators(element: HTMLElement, document: Document): LocatorStrategy[] {
    const locators: LocatorStrategy[] = [];

    // Try each locator type
    const idLocator = this.generateIdLocator(element, document);
    if (idLocator) {
      locators.push(idLocator);
    }

    const classLocator = this.generateClassLocator(element, document);
    if (classLocator) {
      locators.push(classLocator);
    }

    const nameLocator = this.generateNameLocator(element, document);
    if (nameLocator) {
      locators.push(nameLocator);
    }

    const tagLocator = this.generateTagLocator(element, document);
    locators.push(tagLocator);

    // Sort by confidence score descending
    return locators.sort((a, b) => b.confidence.score - a.confidence.score);
  }

  /**
       * Assesses the stability of an attribute value
       * 
       * @param type - The attribute type (id, class, name, tag)
       * @param value - The attribute value to assess
       * @returns Stability score from 0-100
       */
  assessAttributeStability(type: string, value: string): number {
    let score = 50; // Base score

    switch (type) {
    case 'id':
      score = this.assessIdStability(value);
      break;
    case 'class':
      score = this.assessClassStability(value);
      break;
    case 'name':
      score = this.assessNameStability(value);
      break;
    case 'tag':
      score = this.assessTagStability(value);
      break;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
       * Validates ID uniqueness in the document
       */
  private validateIdUniqueness(id: string, targetElement: HTMLElement, document: Document): boolean {
    try {
      const foundElement = document.getElementById(id);
      if (!foundElement) {
        return false;
      }

      // Also check with querySelectorAll to catch duplicate IDs
      const allElements = document.querySelectorAll(`#${id}`);
      return allElements.length === 1 && foundElement === targetElement;
    } catch (error) {
      // Store error for later use in confidence scoring
      this._lastValidationError = error;
      return false;
    }
  }



  /**
       * Validates name uniqueness in the document
       */
  private validateNameUniqueness(name: string, targetElement: HTMLElement, document: Document): boolean {
    try {
      const elements = document.getElementsByName(name);
      return elements.length === 1 && elements[0] === targetElement;
    } catch (error) {
      return false;
    }
  }

  /**
       * Validates tag uniqueness in the document
       */
  private validateTagUniqueness(tagName: string, targetElement: HTMLElement, document: Document): boolean {
    try {
      const elements = document.getElementsByTagName(tagName);
      return elements.length === 1 && elements[0] === targetElement;
    } catch (error) {
      return false;
    }
  }



  /**
       * Finds the best class to use from available classes with detailed info
       */
  private findBestClassWithInfo(classes: string[], document: Document): { className: string; isUnique: boolean; score: number } | null {
    // Score each class and pick the best one
    const classScores = classes.map(cls => ({
      className: cls,
      score: this.assessClassStability(cls),
      isUnique: this.isClassUnique(cls, document)
    }));

    // Prefer unique classes, then by stability score
    classScores.sort((a, b) => {
      if (a.isUnique && !b.isUnique) return -1;
      if (!a.isUnique && b.isUnique) return 1;
      return b.score - a.score;
    });

    return classScores.length > 0 ? classScores[0] : null;
  }

  /**
       * Checks if a class is unique in the document
       */
  private isClassUnique(className: string, document: Document): boolean {
    try {
      const elements = document.getElementsByClassName(className);
      return elements.length === 1;
    } catch (error) {
      return false;
    }
  }

  // Stability scoring constants
  private static readonly STABILITY_SCORES = {
    ID: {
      AUTO_GENERATED: 30,
      UUID_PATTERN: 25,
      SEMANTIC: 95,
      STRUCTURED: 85,
      DEFAULT: 70
    },
    CLASS: {
      AUTO_GENERATED: 25,
      UTILITY: 65,
      SEMANTIC: 85,
      BEM_STYLE: 80,
      DEFAULT: 60
    },
    NAME: {
      GENERIC: 40,
      SEMANTIC: 90,
      CAMEL_CASE: 85,
      DEFAULT: 70
    },
    TAG: {
      SEMANTIC: 75,
      FORM: 70,
      INPUT: 60,
      GENERIC: 40,
      DEFAULT: 55
    }
  };

  // Pattern constants for stability assessment
  private static readonly PATTERNS = {
    ID: {
      AUTO_GENERATED: /^(auto|gen|temp|tmp)-?\d+/,
      LONG_NUMBERS: /\d{6,}/,
      UUID: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
      SEMANTIC: /^[a-z]+(-[a-z]+)*$/,
      STRUCTURED: /^[a-z]+-[a-z]+-[a-z]+/
    },
    CLASS: {
      CSS_IN_JS: /^css-[a-z0-9]+$/i,
      HASH_SUFFIX: /^[a-z]+-[0-9a-f]{6,}$/i,
      UTILITY_SPACING: /^(mt|mb|ml|mr|pt|pb|pl|pr|m|p)-\d+$/,
      UTILITY_SIZING: /^(text|bg|border)-(xs|sm|md|lg|xl|\d+)$/,
      SEMANTIC: /^[a-z]+(-[a-z]+)*$/,
      BEM: /^[a-z]+(__[a-z]+)?(--[a-z]+)?$/
    },
    NAME: {
      GENERIC: /^(field|input|element)\d*$/i,
      SEMANTIC: /^[a-z]+(-[a-z]+)*$/,
      CAMEL_CASE: /^[a-z][a-zA-Z]+$/
    }
  };

  // Tag categorization constants
  private static readonly TAG_CATEGORIES = {
    SEMANTIC: ['main', 'nav', 'header', 'footer', 'aside', 'section', 'article'],
    FORM: ['form', 'fieldset', 'legend'],
    INPUT: ['input', 'select', 'textarea', 'button'],
    GENERIC: ['div', 'span', 'p', 'a']
  };

  /**
       * Assesses ID stability based on patterns
       */
  private assessIdStability(id: string): number {
    const patterns = AttributeLocatorGenerator.PATTERNS.ID;
    const scores = AttributeLocatorGenerator.STABILITY_SCORES.ID;

    // Auto-generated patterns
    if (patterns.AUTO_GENERATED.test(id) || patterns.LONG_NUMBERS.test(id)) {
      return scores.AUTO_GENERATED;
    }

    // UUID-like patterns
    if (patterns.UUID.test(id)) {
      return scores.UUID_PATTERN;
    }

    // Semantic, descriptive IDs
    if (patterns.SEMANTIC.test(id) && id.length > 3) {
      return scores.SEMANTIC;
    }

    // Mixed alphanumeric but structured
    if (patterns.STRUCTURED.test(id)) {
      return scores.STRUCTURED;
    }

    return scores.DEFAULT;
  }

  /**
       * Assesses class stability based on patterns
       */
  private assessClassStability(className: string): number {
    const patterns = AttributeLocatorGenerator.PATTERNS.CLASS;
    const scores = AttributeLocatorGenerator.STABILITY_SCORES.CLASS;

    // Auto-generated CSS-in-JS patterns
    if (patterns.CSS_IN_JS.test(className) || patterns.HASH_SUFFIX.test(className)) {
      return scores.AUTO_GENERATED;
    }

    // Utility classes (Tailwind, Bootstrap utilities)
    if (patterns.UTILITY_SPACING.test(className) || patterns.UTILITY_SIZING.test(className)) {
      return scores.UTILITY;
    }

    // Semantic, descriptive classes
    if (patterns.SEMANTIC.test(className) && className.length > 3) {
      return scores.SEMANTIC;
    }

    // BEM-style classes
    if (patterns.BEM.test(className)) {
      return scores.BEM_STYLE;
    }

    return scores.DEFAULT;
  }

  /**
       * Assesses name stability based on patterns
       */
  private assessNameStability(name: string): number {
    const patterns = AttributeLocatorGenerator.PATTERNS.NAME;
    const scores = AttributeLocatorGenerator.STABILITY_SCORES.NAME;

    // Generic field names
    if (patterns.GENERIC.test(name)) {
      return scores.GENERIC;
    }

    // Semantic, descriptive names
    if (patterns.SEMANTIC.test(name) && name.length > 3) {
      return scores.SEMANTIC;
    }

    // Camel case names
    if (patterns.CAMEL_CASE.test(name)) {
      return scores.CAMEL_CASE;
    }

    return scores.DEFAULT;
  }

  /**
       * Assesses tag stability based on semantic meaning
       */
  private assessTagStability(tagName: string): number {
    const categories = AttributeLocatorGenerator.TAG_CATEGORIES;
    const scores = AttributeLocatorGenerator.STABILITY_SCORES.TAG;

    if (categories.SEMANTIC.includes(tagName)) {
      return scores.SEMANTIC;
    }

    if (categories.FORM.includes(tagName)) {
      return scores.FORM;
    }

    if (categories.INPUT.includes(tagName)) {
      return scores.INPUT;
    }

    if (categories.GENERIC.includes(tagName)) {
      return scores.GENERIC;
    }

    return scores.DEFAULT;
  }

  /**
       * Generates confidence score with detailed factors and warnings
       */
  private generateConfidenceScore(
    type: string,
    selector: string,
    isUnique: boolean,
    stabilityScore: number
  ): ConfidenceScore {
    const factors: ConfidenceFactor[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Uniqueness factor (40% weight)
    score += this.calculateUniquenessScore(type, isUnique, factors, warnings);

    // Stability factor (50% weight)
    const stabilityContribution = (stabilityScore / 100) * 50;
    score += stabilityContribution;

    // Type-specific factors with distinct weights for proper hierarchy
    score += this.calculateTypeSpecificScore(type, selector, factors, warnings);

    // DOM query error handling
    if (this._lastValidationError) {
      warnings.push('Unable to validate uniqueness due to DOM query error');
      this._lastValidationError = null; // Clear the error
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      factors,
      warnings
    };
  }

  /**
     * Calculates uniqueness contribution to confidence score
     */
  private calculateUniquenessScore(
    type: string,
    isUnique: boolean,
    factors: ConfidenceFactor[],
    warnings: string[]
  ): number {
    if (isUnique) {
      factors.push({
        factor: 'Uniqueness',
        impact: 'positive',
        weight: 0.4,
        description: `${type.toUpperCase()} uniquely identifies the element`
      });
      return 40;
    } else {
      factors.push({
        factor: 'Non-unique selector',
        impact: 'negative',
        weight: 0.4,
        description: `${type.toUpperCase()} matches multiple elements`
      });
      const displayType = type === 'id' ? 'ID' : type.charAt(0).toUpperCase() + type.slice(1);
      warnings.push(`${displayType} is not unique in the document`);
      return 0;
    }
  }

  /**
     * Calculates type-specific contribution to confidence score
     */
  private calculateTypeSpecificScore(
    type: string,
    selector: string,
    factors: ConfidenceFactor[],
    warnings: string[]
  ): number {
    switch (type) {
    case 'id':
      return this.calculateIdTypeScore(selector, factors, warnings);
    case 'class':
      return this.calculateClassTypeScore(selector, factors, warnings);
    case 'name':
      return this.calculateNameTypeScore(factors);
    case 'tag':
      return this.calculateTagTypeScore(selector, factors);
    default:
      return 0;
    }
  }

  /**
     * Calculates ID-specific type score
     */
  private calculateIdTypeScore(
    selector: string,
    factors: ConfidenceFactor[],
    warnings: string[]
  ): number {
    factors.push({
      factor: 'ID selector',
      impact: 'positive',
      weight: 0.1,
      description: 'ID selectors are highly reliable'
    });

    if (this.isAutoGeneratedId(selector)) {
      warnings.push('ID appears to be auto-generated and may change');
    }

    return 10;
  }

  /**
     * Calculates class-specific type score
     */
  private calculateClassTypeScore(
    selector: string,
    factors: ConfidenceFactor[],
    warnings: string[]
  ): number {
    if (this.isAutoGeneratedClass(selector)) {
      factors.push({
        factor: 'Auto-generated class',
        impact: 'negative',
        weight: 0.15,
        description: 'Auto-generated classes are unreliable'
      });
      warnings.push('Class appears to be auto-generated and may change');
      return -15;
    } else {
      factors.push({
        factor: 'Class selector',
        impact: 'positive',
        weight: 0.08,
        description: 'Class selectors have moderate reliability'
      });
      return 8;
    }
  }

  /**
     * Calculates name-specific type score
     */
  private calculateNameTypeScore(factors: ConfidenceFactor[]): number {
    factors.push({
      factor: 'Name selector',
      impact: 'positive',
      weight: 0.07, // Slightly higher than class to ensure proper hierarchy
      description: 'Name selectors are reliable for form elements'
    });
    return 7;
  }

  /**
     * Calculates tag-specific type score
     */
  private calculateTagTypeScore(selector: string, factors: ConfidenceFactor[]): number {
    if (AttributeLocatorGenerator.TAG_CATEGORIES.SEMANTIC.includes(selector)) {
      factors.push({
        factor: 'Semantic tag selector',
        impact: 'positive',
        weight: 0.03,
        description: 'Semantic tags have better reliability'
      });
      return 3;
    } else {
      factors.push({
        factor: 'Tag selector',
        impact: 'negative',
        weight: 0.11,
        description: 'Tag selectors have low reliability'
      });
      return -11;
    }
  }

  /**
       * Generates human-readable explanation for the locator
       */
  private generateExplanation(type: string, selector: string, isUnique: boolean, isStable: boolean): string {
    let explanation = `Generated ${type.toUpperCase()} locator: ${selector}. `;

    switch (type) {
    case 'id':
      explanation += 'Uses element ID for identification. ';
      break;
    case 'class':
      explanation += 'Uses CSS class for identification. ';
      break;
    case 'name':
      explanation += 'Uses name attribute for form element identification. ';
      break;
    case 'tag':
      explanation += 'Uses HTML tag name for identification. ';
      break;
    }

    if (!isUnique) {
      explanation += `Warning: ${type.toUpperCase()} may match multiple elements. `;
    }

    if (!isStable) {
      explanation += `Warning: ${type.toUpperCase()} may be unstable across page changes.`;
    }

    return explanation.trim();
  }

  /**
       * Checks if an ID appears to be auto-generated
       */
  private isAutoGeneratedId(id: string): boolean {
    const patterns = AttributeLocatorGenerator.PATTERNS.ID;
    return patterns.AUTO_GENERATED.test(id) ||
      patterns.LONG_NUMBERS.test(id) ||
      patterns.UUID.test(id);
  }

  /**
       * Checks if a class appears to be auto-generated
       */
  private isAutoGeneratedClass(className: string): boolean {
    const patterns = AttributeLocatorGenerator.PATTERNS.CLASS;
    return patterns.CSS_IN_JS.test(className) ||
      patterns.HASH_SUFFIX.test(className);
  }
}