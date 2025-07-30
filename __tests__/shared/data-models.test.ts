/**
 * @fileoverview Tests for core data models and interfaces
 * Following TDD methodology - these tests define the expected behavior
 */

import {
  LocatorStrategy,
  ConfidenceScore,
  ConfidenceFactor,
  LocatorData,
  UserPreferences,
  validateLocatorStrategy,
  validateConfidenceScore,
  validateLocatorData,
  validateUserPreferences,
  isLocatorType,
  createDefaultUserPreferences,
  serializeLocatorData,
  deserializeLocatorData
} from '../../src/shared/data-models';

describe('Data Models - TDD Implementation', () => {

  describe('LocatorStrategy Interface', () => {
    it('should validate a valid LocatorStrategy object', () => {
      const validStrategy: LocatorStrategy = {
        type: 'css',
        selector: '#test-element',
        confidence: {
          score: 85,
          factors: [],
          warnings: []
        },
        explanation: 'Uses unique ID selector',
        isUnique: true,
        isStable: true
      };

      expect(validateLocatorStrategy(validStrategy)).toBe(true);
    });

    it('should reject LocatorStrategy with invalid type', () => {
      const invalidStrategy = {
        type: 'invalid-type',
        selector: '#test',
        confidence: { score: 50, factors: [], warnings: [] },
        explanation: 'Test',
        isUnique: true,
        isStable: true
      };

      expect(validateLocatorStrategy(invalidStrategy as any)).toBe(false);
    });

    it('should reject LocatorStrategy with missing required fields', () => {
      const incompleteStrategy = {
        type: 'css',
        selector: '#test'
        // Missing confidence, explanation, isUnique, isStable
      };

      expect(validateLocatorStrategy(incompleteStrategy as any)).toBe(false);
    });

    it('should reject LocatorStrategy with invalid confidence score range', () => {
      const invalidStrategy: LocatorStrategy = {
        type: 'xpath',
        selector: '//div[@id="test"]',
        confidence: {
          score: 150, // Invalid: should be 0-100
          factors: [],
          warnings: []
        },
        explanation: 'Test explanation',
        isUnique: true,
        isStable: false
      };

      expect(validateLocatorStrategy(invalidStrategy)).toBe(false);
    });
  });

  describe('ConfidenceScore Interface', () => {
    it('should validate a valid ConfidenceScore object', () => {
      const validScore: ConfidenceScore = {
        score: 75,
        factors: [
          {
            factor: 'unique-id',
            impact: 'positive',
            weight: 0.8,
            description: 'Element has unique ID attribute'
          }
        ],
        warnings: ['Element position may change']
      };

      expect(validateConfidenceScore(validScore)).toBe(true);
    });

    it('should reject ConfidenceScore with score outside 0-100 range', () => {
      const invalidScore = {
        score: -10,
        factors: [],
        warnings: []
      };

      expect(validateConfidenceScore(invalidScore as any)).toBe(false);
    });

    it('should validate ConfidenceFactor with positive impact', () => {
      const factor: ConfidenceFactor = {
        factor: 'stable-attribute',
        impact: 'positive',
        weight: 0.6,
        description: 'Uses stable data attribute'
      };

      const score: ConfidenceScore = {
        score: 80,
        factors: [factor],
        warnings: []
      };

      expect(validateConfidenceScore(score)).toBe(true);
    });

    it('should validate ConfidenceFactor with negative impact', () => {
      const factor: ConfidenceFactor = {
        factor: 'generated-class',
        impact: 'negative',
        weight: 0.3,
        description: 'Uses auto-generated CSS class'
      };

      const score: ConfidenceScore = {
        score: 40,
        factors: [factor],
        warnings: ['May break with UI updates']
      };

      expect(validateConfidenceScore(score)).toBe(true);
    });
  });

  describe('LocatorData Interface', () => {
    it('should validate a complete LocatorData object', () => {
      const validData: LocatorData = {
        id: 'loc-123456',
        timestamp: Date.now(),
        url: 'https://example.com/test',
        elementInfo: {
          tagName: 'BUTTON',
          textContent: 'Click me',
          attributes: { id: 'submit-btn', class: 'btn primary' },
          position: { x: 100, y: 200, width: 80, height: 32, top: 200, left: 100, bottom: 232, right: 180 },
          xpath: '//button[@id="submit-btn"]'
        },
        strategies: [
          {
            type: 'id',
            selector: '#submit-btn',
            confidence: { score: 95, factors: [], warnings: [] },
            explanation: 'Unique ID selector',
            isUnique: true,
            isStable: true
          }
        ]
      };

      expect(validateLocatorData(validData)).toBe(true);
    });

    it('should validate LocatorData with optional screenshot', () => {
      const dataWithScreenshot: LocatorData = {
        id: 'loc-789',
        timestamp: Date.now(),
        url: 'https://test.com',
        elementInfo: {
          tagName: 'DIV',
          textContent: 'Content',
          attributes: {},
          position: { x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, bottom: 50, right: 100 },
          xpath: '//div[1]'
        },
        strategies: [],
        screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      };

      expect(validateLocatorData(dataWithScreenshot)).toBe(true);
    });

    it('should reject LocatorData with invalid timestamp', () => {
      const invalidData = {
        id: 'loc-invalid',
        timestamp: 'not-a-number',
        url: 'https://example.com',
        elementInfo: {
          tagName: 'DIV',
          textContent: '',
          attributes: {},
          position: { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 },
          xpath: '//div'
        },
        strategies: []
      };

      expect(validateLocatorData(invalidData as any)).toBe(false);
    });
  });

  describe('UserPreferences Interface', () => {
    it('should validate valid UserPreferences object', () => {
      const validPrefs: UserPreferences = {
        theme: 'dark',
        defaultLocatorTypes: ['css', 'xpath', 'id'],
        historyLimit: 100,
        showConfidenceExplanations: true,
        enableScreenshots: false,
        highlightColor: '#ff0000'
      };

      expect(validateUserPreferences(validPrefs)).toBe(true);
    });

    it('should reject UserPreferences with invalid theme', () => {
      const invalidPrefs = {
        theme: 'invalid-theme',
        defaultLocatorTypes: ['css'],
        historyLimit: 50,
        showConfidenceExplanations: true,
        enableScreenshots: true,
        highlightColor: '#00ff00'
      };

      expect(validateUserPreferences(invalidPrefs as any)).toBe(false);
    });

    it('should reject UserPreferences with invalid locator types', () => {
      const invalidPrefs = {
        theme: 'light',
        defaultLocatorTypes: ['css', 'invalid-type'],
        historyLimit: 50,
        showConfidenceExplanations: true,
        enableScreenshots: true,
        highlightColor: '#0000ff'
      };

      expect(validateUserPreferences(invalidPrefs as any)).toBe(false);
    });

    it('should create default UserPreferences', () => {
      const defaults = createDefaultUserPreferences();

      expect(defaults.theme).toBe('auto');
      expect(defaults.defaultLocatorTypes).toContain('css');
      expect(defaults.defaultLocatorTypes).toContain('xpath');
      expect(defaults.historyLimit).toBeGreaterThan(0);
      expect(typeof defaults.showConfidenceExplanations).toBe('boolean');
      expect(typeof defaults.enableScreenshots).toBe('boolean');
      expect(defaults.highlightColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('Type Guards and Utilities', () => {
    it('should correctly identify valid LocatorType', () => {
      expect(isLocatorType('css')).toBe(true);
      expect(isLocatorType('xpath')).toBe(true);
      expect(isLocatorType('id')).toBe(true);
      expect(isLocatorType('class')).toBe(true);
      expect(isLocatorType('name')).toBe(true);
      expect(isLocatorType('tag')).toBe(true);
      expect(isLocatorType('aria')).toBe(true);
      expect(isLocatorType('invalid')).toBe(false);
    });
  });

  describe('Serialization and Deserialization', () => {
    it('should serialize and deserialize LocatorData correctly', () => {
      const originalData: LocatorData = {
        id: 'test-123',
        timestamp: 1642680000000,
        url: 'https://example.com',
        elementInfo: {
          tagName: 'INPUT',
          textContent: '',
          attributes: { type: 'text', name: 'username' },
          position: { x: 10, y: 20, width: 200, height: 30, top: 20, left: 10, bottom: 50, right: 210 },
          xpath: '//input[@name="username"]'
        },
        strategies: [
          {
            type: 'name',
            selector: '[name="username"]',
            confidence: { score: 80, factors: [], warnings: [] },
            explanation: 'Uses name attribute',
            isUnique: true,
            isStable: true
          }
        ]
      };

      const serialized = serializeLocatorData(originalData);
      const deserialized = deserializeLocatorData(serialized);

      expect(deserialized).toEqual(originalData);
    });

    it('should handle serialization errors gracefully', () => {
      const invalidData = { circular: {} };
      invalidData.circular = invalidData; // Create circular reference

      expect(() => serializeLocatorData(invalidData as any)).toThrow();
    });

    it('should handle deserialization errors gracefully', () => {
      const invalidJson = '{ invalid json }';

      expect(() => deserializeLocatorData(invalidJson)).toThrow();
    });
  });
});