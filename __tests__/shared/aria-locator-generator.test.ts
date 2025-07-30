/**
 * @fileoverview Test suite for ARIA accessibility locator generation
 * 
 * This test suite follows Test-Driven Development (TDD) methodology with
 * Red-Green-Refactor cycles. All tests are written before implementation
 * to ensure comprehensive coverage of ARIA locator generation functionality.
 * 
 * Requirements Coverage:
 * - Requirement 4.2: ARIA attribute detection and accessibility-friendly locators
 * - Requirement 4.3: ARIA snapshot generation functionality
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import { JSDOM } from 'jsdom';
import { AriaLocatorGenerator } from '../../src/shared/aria-locator-generator';

// Mock DOM environment setup
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window as any;

describe('AriaLocatorGenerator', () => {
  let generator: AriaLocatorGenerator;

  beforeEach(() => {
    // Reset DOM for each test
    document.body.innerHTML = '';
    generator = new AriaLocatorGenerator();
  });

  describe('ARIA Attribute Detection', () => {
    test('should detect role attribute and generate role-based locator', () => {
      // Arrange
      const element = document.createElement('button');
      element.setAttribute('role', 'submit');
      element.textContent = 'Submit Form';
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.type).toBe('aria');
      expect(result!.selector).toBe('[role="submit"]');
      expect(result!.isUnique).toBe(true);
      expect(result!.confidence.score).toBeGreaterThan(70);
    });

    test('should detect aria-label attribute and generate aria-label locator', () => {
      // Arrange
      const element = document.createElement('input');
      element.setAttribute('aria-label', 'Search products');
      element.setAttribute('type', 'text');
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.type).toBe('aria');
      expect(result!.selector).toBe('[aria-label="Search products"]');
      expect(result!.isUnique).toBe(true);
      expect(result!.confidence.score).toBeGreaterThan(80);
    });

    test('should detect aria-labelledby attribute and generate appropriate locator', () => {
      // Arrange
      const label = document.createElement('label');
      label.id = 'username-label';
      label.textContent = 'Username';
      document.body.appendChild(label);

      const element = document.createElement('input');
      element.setAttribute('aria-labelledby', 'username-label');
      element.setAttribute('type', 'text');
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.type).toBe('aria');
      expect(result!.selector).toBe('[aria-labelledby="username-label"]');
      expect(result!.isUnique).toBe(true);
    });

    test('should detect aria-describedby attribute and generate locator', () => {
      // Arrange
      const description = document.createElement('div');
      description.id = 'password-help';
      description.textContent = 'Password must be at least 8 characters';
      document.body.appendChild(description);

      const element = document.createElement('input');
      element.setAttribute('aria-describedby', 'password-help');
      element.setAttribute('type', 'password');
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.type).toBe('aria');
      expect(result!.selector).toBe('[aria-describedby="password-help"]');
    });

    test('should detect multiple ARIA attributes and prioritize most reliable', () => {
      // Arrange
      const element = document.createElement('button');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', 'Close dialog');
      element.setAttribute('aria-pressed', 'false');
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.type).toBe('aria');
      // Should prioritize aria-label over role for uniqueness
      expect(result!.selector).toBe('[aria-label="Close dialog"]');
      expect(result!.confidence.score).toBeGreaterThan(80);
    });
  });

  describe('ARIA Locator Uniqueness Validation', () => {
    test('should validate uniqueness of role-based locators', () => {
      // Arrange
      const button1 = document.createElement('button');
      button1.setAttribute('role', 'submit');
      button1.textContent = 'Submit';
      document.body.appendChild(button1);

      const button2 = document.createElement('button');
      button2.setAttribute('role', 'submit');
      button2.textContent = 'Save';
      document.body.appendChild(button2);

      // Act
      const result = generator.generateAriaLocator(button1);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.isUnique).toBe(false);
      expect(result!.confidence.score).toBeLessThan(60);
      expect(result!.confidence.warnings).toContain('Multiple elements found with same ARIA attributes');
    });

    test('should validate uniqueness of aria-label locators', () => {
      // Arrange
      const input1 = document.createElement('input');
      input1.setAttribute('aria-label', 'Email address');
      document.body.appendChild(input1);

      const input2 = document.createElement('input');
      input2.setAttribute('aria-label', 'Confirm email');
      document.body.appendChild(input2);

      // Act
      const result1 = generator.generateAriaLocator(input1);
      const result2 = generator.generateAriaLocator(input2);

      // Assert
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1!.isUnique).toBe(true);
      expect(result2!.isUnique).toBe(true);
      expect(result1!.confidence.score).toBeGreaterThan(70);
      expect(result2!.confidence.score).toBeGreaterThan(70);
    });
  });

  describe('ARIA Confidence Scoring', () => {
    test('should assign high confidence to aria-label locators', () => {
      // Arrange
      const element = document.createElement('button');
      element.setAttribute('aria-label', 'Delete item');
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.confidence.score).toBeGreaterThan(80);
      expect(result!.confidence.factors).toContainEqual(
        expect.objectContaining({
          factor: 'aria-label',
          impact: 'positive',
          description: expect.stringContaining('descriptive')
        })
      );
    });

    test('should assign medium confidence to role-based locators', () => {
      // Arrange
      const element = document.createElement('div');
      element.setAttribute('role', 'navigation');
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.confidence.score).toBeGreaterThan(60);
      expect(result!.confidence.score).toBeLessThan(80);
      expect(result!.confidence.factors).toContainEqual(
        expect.objectContaining({
          factor: 'role',
          impact: 'positive'
        })
      );
    });

    test('should assign lower confidence to generic ARIA attributes', () => {
      // Arrange
      const element = document.createElement('div');
      element.setAttribute('aria-hidden', 'false');
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.confidence.score).toBeLessThan(60);
      expect(result!.confidence.warnings).toContain('Generic ARIA attribute may not be reliable for locating');
    });
  });

  describe('ARIA Snapshot Generation', () => {
    test('should generate comprehensive ARIA snapshot for element', () => {
      // Arrange
      const element = document.createElement('button');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', 'Save document');
      element.setAttribute('aria-pressed', 'false');
      element.setAttribute('aria-describedby', 'save-help');
      element.textContent = 'Save';
      document.body.appendChild(element);

      const helpText = document.createElement('div');
      helpText.id = 'save-help';
      helpText.textContent = 'Saves the current document';
      document.body.appendChild(helpText);

      // Act
      const snapshot = generator.generateAriaSnapshot(element);

      // Assert
      expect(snapshot).toBeDefined();
      expect(snapshot.element).toBe('button');
      expect(snapshot.ariaAttributes).toEqual({
        'role': 'button',
        'aria-label': 'Save document',
        'aria-pressed': 'false',
        'aria-describedby': 'save-help'
      });
      expect(snapshot.accessibleName).toBe('Save document');
      expect(snapshot.accessibleDescription).toBe('Saves the current document');
    });

    test('should generate ARIA snapshot with computed accessible name', () => {
      // Arrange
      const label = document.createElement('label');
      label.setAttribute('for', 'email-input');
      label.textContent = 'Email Address';
      document.body.appendChild(label);

      const element = document.createElement('input');
      element.id = 'email-input';
      element.setAttribute('type', 'email');
      element.setAttribute('required', 'true');
      document.body.appendChild(element);

      // Act
      const snapshot = generator.generateAriaSnapshot(element);

      // Assert
      expect(snapshot.element).toBe('input');
      expect(snapshot.accessibleName).toBe('Email Address');
      expect(snapshot.role).toBe('textbox');
      expect(snapshot.states).toContain('required');
    });

    test('should generate ARIA snapshot with role hierarchy', () => {
      // Arrange
      const nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Main navigation');
      document.body.appendChild(nav);

      const list = document.createElement('ul');
      nav.appendChild(list);

      const item = document.createElement('li');
      list.appendChild(item);

      const link = document.createElement('a');
      link.href = '/home';
      link.textContent = 'Home';
      item.appendChild(link);

      // Act
      const snapshot = generator.generateAriaSnapshot(link);

      // Assert
      expect(snapshot.element).toBe('a');
      expect(snapshot.role).toBe('link');
      expect(snapshot.hierarchy).toContain('navigation');
      expect(snapshot.hierarchy).toContain('list');
      expect(snapshot.hierarchy).toContain('listitem');
    });
  });

  describe('Error Handling', () => {
    test('should handle null element gracefully', () => {
      // Act & Assert
      expect(() => generator.generateAriaLocator(null as any)).toThrow('Element cannot be null or undefined');
    });

    test('should handle element with no ARIA attributes', () => {
      // Arrange
      const element = document.createElement('div');
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).toBeNull();
    });

    test('should handle malformed ARIA attributes', () => {
      // Arrange
      const element = document.createElement('div');
      element.setAttribute('aria-label', '');
      element.setAttribute('role', '   ');
      document.body.appendChild(element);

      // Act
      const result = generator.generateAriaLocator(element);

      // Assert
      expect(result).toBeNull();
    });

    test('should handle DOM query errors gracefully', () => {
      // Arrange
      const element = document.createElement('div');
      element.setAttribute('aria-label', 'Test[invalid');
      document.body.appendChild(element);

      // Mock querySelectorAll to throw error
      const originalQuerySelectorAll = document.querySelectorAll;

      try {
        document.querySelectorAll = jest.fn().mockImplementation(() => {
          throw new Error('Invalid selector');
        });

        // Act
        const result = generator.generateAriaLocator(element);

        // Assert
        expect(result).not.toBeNull();
        expect(result!.confidence.warnings).toContain('Could not validate locator uniqueness');
      } finally {
        // Ensure cleanup happens regardless of test outcome
        document.querySelectorAll = originalQuerySelectorAll;
      }
    });
  });

  describe('ARIA Locator Integration', () => {
    test('should generate multiple ARIA locator strategies when available', () => {
      // Arrange
      const element = document.createElement('button');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', 'Submit form');
      element.setAttribute('aria-describedby', 'submit-help');
      document.body.appendChild(element);

      // Act
      const strategies = generator.generateAllAriaStrategies(element);

      // Assert
      expect(strategies).toHaveLength(3);
      expect(strategies.map((s: any) => s.selector)).toContain('[aria-label="Submit form"]');
      expect(strategies.map((s: any) => s.selector)).toContain('[role="button"]');
      expect(strategies.map((s: any) => s.selector)).toContain('[aria-describedby="submit-help"]');
    });

    test('should prioritize strategies by confidence score', () => {
      // Arrange
      const element = document.createElement('input');
      element.setAttribute('role', 'textbox');
      element.setAttribute('aria-label', 'Search query');
      element.setAttribute('aria-required', 'true');
      document.body.appendChild(element);

      // Act
      const strategies = generator.generateAllAriaStrategies(element);

      // Assert
      expect(strategies).toHaveLength(3);
      // Should be sorted by confidence score (highest first)
      expect(strategies[0].confidence.score).toBeGreaterThanOrEqual(strategies[1].confidence.score);
      expect(strategies[1].confidence.score).toBeGreaterThanOrEqual(strategies[2].confidence.score);
    });
  });
});