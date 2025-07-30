/**
 * @fileoverview Test suite for Confidence Scoring Engine
 * 
 * This test suite follows Test-Driven Development (TDD) methodology to ensure
 * comprehensive coverage of confidence scoring algorithms for all locator types.
 * 
 * TDD Cycle: RED-GREEN-REFACTOR
 * - RED: Write failing tests that define expected behavior
 * - GREEN: Write minimal code to make tests pass
 * - REFACTOR: Improve code structure while keeping tests green
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

import { ConfidenceScoringEngine } from '../../src/shared/confidence-scoring-engine';
import { LocatorStrategy } from '../../src/shared/data-models';

describe('ConfidenceScoringEngine', () => {
  let engine: ConfidenceScoringEngine;
  let mockDocument: Document;
  let mockElement: HTMLElement;

  beforeEach(() => {
    engine = new ConfidenceScoringEngine();

    // Create mock DOM environment
    mockDocument = {
      getElementById: jest.fn(),
      getElementsByClassName: jest.fn(),
      getElementsByName: jest.fn(),
      getElementsByTagName: jest.fn(),
      querySelectorAll: jest.fn(),
      evaluate: jest.fn()
    } as any;

    mockElement = {
      id: 'test-element',
      className: 'test-class',
      tagName: 'DIV',
      getAttribute: jest.fn()
    } as any;
  });

  describe('calculateConfidenceScore', () => {
    it('should throw error for null locator strategy', () => {
      expect(() => {
        engine.calculateConfidenceScore(null as any, mockElement, mockDocument);
      }).toThrow('Locator strategy cannot be null or undefined');
    });

    it('should throw error for null element', () => {
      const strategy: LocatorStrategy = {
        type: 'css',
        selector: '#test',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      expect(() => {
        engine.calculateConfidenceScore(strategy, null as any, mockDocument);
      }).toThrow('Element cannot be null or undefined');
    });

    it('should throw error for null document', () => {
      const strategy: LocatorStrategy = {
        type: 'css',
        selector: '#test',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      expect(() => {
        engine.calculateConfidenceScore(strategy, mockElement, null as any);
      }).toThrow('Document cannot be null or undefined');
    });

    it('should calculate high confidence for unique ID selector', () => {
      const strategy: LocatorStrategy = {
        type: 'id',
        selector: 'unique-button',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);

      expect(result.score).toBeGreaterThan(85);
      expect(result.factors).toContainEqual(
        expect.objectContaining({
          factor: 'ID selector',
          impact: 'positive'
        })
      );
      expect(result.factors).toContainEqual(
        expect.objectContaining({
          factor: 'Uniqueness',
          impact: 'positive'
        })
      );
      expect(result.warnings).toHaveLength(0);
    });

    it('should calculate medium confidence for unique CSS class selector', () => {
      const strategy: LocatorStrategy = {
        type: 'class',
        selector: 'semantic-button',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);

      expect(result.score).toBeGreaterThan(60);
      expect(result.score).toBeLessThan(85);
      expect(result.factors).toContainEqual(
        expect.objectContaining({
          factor: 'Class selector',
          impact: 'positive'
        })
      );
    });

    it('should calculate low confidence for non-unique tag selector', () => {
      const strategy: LocatorStrategy = {
        type: 'tag',
        selector: 'div',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: false,
        isStable: false
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);

      expect(result.score).toBeLessThan(40);
      expect(result.factors).toContainEqual(
        expect.objectContaining({
          factor: 'Non-unique selector',
          impact: 'negative'
        })
      );
      expect(result.warnings).toContain('Selector matches multiple elements');
    });

    it('should add auto-generated warning for CSS-in-JS classes', () => {
      const strategy: LocatorStrategy = {
        type: 'class',
        selector: 'css-1a2b3c4d',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: false
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);

      expect(result.warnings).toContain('Contains auto-generated class names that may change');
      expect(result.factors).toContainEqual(
        expect.objectContaining({
          factor: 'Auto-generated pattern',
          impact: 'negative'
        })
      );
    });

    it('should add position-based warning for XPath with indices', () => {
      const strategy: LocatorStrategy = {
        type: 'xpath',
        selector: '//div[@class="container"]/button[2]',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: false
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);

      expect(result.warnings).toContain('Uses position-based selectors that may break with DOM changes');
      expect(result.factors).toContainEqual(
        expect.objectContaining({
          factor: 'Position-based selector',
          impact: 'negative'
        })
      );
    });

    it('should handle ARIA locators with accessibility bonus', () => {
      const strategy: LocatorStrategy = {
        type: 'aria',
        selector: 'button[aria-label="Submit form"]',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);

      expect(result.factors).toContainEqual(
        expect.objectContaining({
          factor: 'Accessibility-friendly',
          impact: 'positive'
        })
      );
      expect(result.score).toBeGreaterThan(70);
    });

    it('should calculate confidence for name attribute on form elements', () => {
      const strategy: LocatorStrategy = {
        type: 'name',
        selector: 'email-input',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);

      expect(result.factors).toContainEqual(
        expect.objectContaining({
          factor: 'Name attribute',
          impact: 'positive'
        })
      );
      expect(result.score).toBeGreaterThan(65);
    });
  });

  describe('assessStability', () => {
    it('should return high stability for semantic ID', () => {
      const stability = engine.assessStability('id', 'submit-button');
      expect(stability).toBeGreaterThan(80);
    });

    it('should return low stability for auto-generated ID', () => {
      const stability = engine.assessStability('id', 'auto-gen-12345678');
      expect(stability).toBeLessThan(40);
    });

    it('should return medium stability for semantic class', () => {
      const stability = engine.assessStability('class', 'navigation-menu');
      expect(stability).toBeGreaterThan(60);
      expect(stability).toBeLessThan(90);
    });

    it('should return low stability for CSS-in-JS class', () => {
      const stability = engine.assessStability('class', 'css-1a2b3c4d');
      expect(stability).toBeLessThan(40);
    });

    it('should return high stability for semantic name', () => {
      const stability = engine.assessStability('name', 'user-email');
      expect(stability).toBeGreaterThan(80);
    });

    it('should return medium stability for semantic tags', () => {
      const stability = engine.assessStability('tag', 'nav');
      expect(stability).toBeGreaterThan(60);
    });

    it('should return low stability for generic tags', () => {
      const stability = engine.assessStability('tag', 'div');
      expect(stability).toBeLessThan(60);
    });
  });

  describe('detectPatterns', () => {
    it('should detect auto-generated ID patterns', () => {
      const patterns = engine.detectPatterns('id', 'auto-12345678');
      expect(patterns).toContain('auto-generated');
    });

    it('should detect UUID patterns', () => {
      const patterns = engine.detectPatterns('id', '550e8400-e29b-41d4-a716-446655440000');
      expect(patterns).toContain('uuid');
    });

    it('should detect CSS-in-JS patterns', () => {
      const patterns = engine.detectPatterns('class', 'css-1a2b3c4d');
      expect(patterns).toContain('auto-generated');
    });

    it('should detect utility class patterns', () => {
      const patterns = engine.detectPatterns('class', 'mt-4');
      expect(patterns).toContain('utility');
    });

    it('should detect BEM patterns', () => {
      const patterns = engine.detectPatterns('class', 'block__element--modifier');
      expect(patterns).toContain('bem');
    });

    it('should detect position-based XPath patterns', () => {
      const patterns = engine.detectPatterns('xpath', '//div[1]/span[2]');
      expect(patterns).toContain('position-based');
    });

    it('should detect absolute XPath patterns', () => {
      const patterns = engine.detectPatterns('xpath', '/html/body/div[1]/span');
      expect(patterns).toContain('absolute-path');
    });
  });

  describe('generateExplanation', () => {
    it('should generate explanation for high confidence ID selector', () => {
      const strategy: LocatorStrategy = {
        type: 'id',
        selector: 'submit-button',
        confidence: { score: 95, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const explanation = engine.generateExplanation(strategy);

      expect(explanation).toContain('ID selector');
      expect(explanation).toContain('high reliability');
      expect(explanation).toContain('unique');
      expect(explanation).toContain('stable');
    });

    it('should generate explanation with warnings for low confidence selector', () => {
      const strategy: LocatorStrategy = {
        type: 'tag',
        selector: 'div',
        confidence: {
          score: 25,
          factors: [],
          warnings: ['Selector matches multiple elements', 'Low stability']
        },
        explanation: '',
        isUnique: false,
        isStable: false
      };

      const explanation = engine.generateExplanation(strategy);

      expect(explanation).toContain('low reliability');
      expect(explanation).toContain('Warning');
      expect(explanation).toContain('multiple elements');
    });

    it('should generate explanation for ARIA selector with accessibility note', () => {
      const strategy: LocatorStrategy = {
        type: 'aria',
        selector: 'button[aria-label="Close dialog"]',
        confidence: { score: 80, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const explanation = engine.generateExplanation(strategy);

      expect(explanation).toContain('ARIA');
      expect(explanation).toContain('accessibility');
      expect(explanation).toContain('semantic');
    });
  });

  describe('compareStrategies', () => {
    it('should rank ID selector higher than class selector', () => {
      const idStrategy: LocatorStrategy = {
        type: 'id',
        selector: 'submit-btn',
        confidence: { score: 90, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const classStrategy: LocatorStrategy = {
        type: 'class',
        selector: 'btn-primary',
        confidence: { score: 75, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const comparison = engine.compareStrategies(idStrategy, classStrategy);
      expect(comparison).toBeLessThan(0); // idStrategy should come first
    });

    it('should rank unique selector higher than non-unique with same type', () => {
      const uniqueStrategy: LocatorStrategy = {
        type: 'class',
        selector: 'unique-component',
        confidence: { score: 80, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const nonUniqueStrategy: LocatorStrategy = {
        type: 'class',
        selector: 'common-class',
        confidence: { score: 60, factors: [], warnings: [] },
        explanation: '',
        isUnique: false,
        isStable: true
      };

      const comparison = engine.compareStrategies(uniqueStrategy, nonUniqueStrategy);
      expect(comparison).toBeLessThan(0); // uniqueStrategy should come first
    });

    it('should use confidence score as tiebreaker', () => {
      const highConfidenceStrategy: LocatorStrategy = {
        type: 'class',
        selector: 'high-conf',
        confidence: { score: 85, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const lowConfidenceStrategy: LocatorStrategy = {
        type: 'class',
        selector: 'low-conf',
        confidence: { score: 70, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const comparison = engine.compareStrategies(highConfidenceStrategy, lowConfidenceStrategy);
      expect(comparison).toBeLessThan(0); // highConfidenceStrategy should come first
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty selector gracefully', () => {
      const strategy: LocatorStrategy = {
        type: 'css',
        selector: '',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: false,
        isStable: false
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);
      expect(result.score).toBe(0);
      expect(result.warnings).toContain('Empty selector provided');
    });

    it('should handle invalid locator type gracefully', () => {
      const strategy: LocatorStrategy = {
        type: 'invalid' as any,
        selector: 'test',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: false,
        isStable: false
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);
      expect(result.warnings).toContain('Unknown locator type: invalid');
    });

    it('should handle non-unique selector warnings', () => {
      // Test that the engine properly handles non-unique selectors by adding appropriate warnings
      const strategy: LocatorStrategy = {
        type: 'css',
        selector: '#test',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: false, // This will trigger the non-unique warning
        isStable: true
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);
      expect(result.warnings).toContain('Selector matches multiple elements');
    });

    it('should handle DOM query errors during uniqueness scoring', () => {
      // Mock the calculateUniquenessScore method to throw an error
      const originalMethod = (engine as any).calculateUniquenessScore;
      (engine as any).calculateUniquenessScore = jest.fn().mockImplementation(() => {
        throw new Error('DOM query failed');
      });

      const strategy: LocatorStrategy = {
        type: 'css',
        selector: '#test',
        confidence: { score: 0, factors: [], warnings: [] },
        explanation: '',
        isUnique: true,
        isStable: true
      };

      const result = engine.calculateConfidenceScore(strategy, mockElement, mockDocument);

      // Should handle the error gracefully
      expect(result.warnings).toContain('Could not validate selector uniqueness due to DOM error');
      expect(result.factors.some(f => f.factor === 'uniqueness_error')).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0); // Should not crash

      // Restore original method
      (engine as any).calculateUniquenessScore = originalMethod;
    });
  });
});