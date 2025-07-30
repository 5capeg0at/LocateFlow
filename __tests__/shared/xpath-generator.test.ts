/**
 * @fileoverview Tests for XPath locator generation functionality
 * 
 * This test suite follows TDD methodology to drive the implementation of
 * XPath expression generation using element position, attributes, and hierarchy.
 * Includes XPath optimization and uniqueness validation.
 * 
 * Requirements covered:
 * - 2.1: XPath locator generation strategy
 * - 3.2: Confidence scoring for locator reliability
 * - 3.4: Uniqueness validation and stability assessment
 */

import { XPathGenerator } from '../../src/shared/xpath-generator';

// Mock DOM environment setup
const mockDocument = {
  querySelectorAll: jest.fn(),
  querySelector: jest.fn(),
  evaluate: jest.fn(),
  createElement: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

// Mock HTMLElement for testing
const createMockElement = (attributes: Record<string, string> = {}, tagName = 'div'): HTMLElement => {
  const element = {
    tagName: tagName.toUpperCase(),
    id: attributes.id || '',
    className: attributes.class || '',
    getAttribute: jest.fn((attr: string) => attributes[attr] || null),
    setAttribute: jest.fn(),
    hasAttribute: jest.fn((attr: string) => attr in attributes),
    attributes: Object.keys(attributes).map(name => ({ name, value: attributes[name] })),
    parentElement: null,
    children: [],
    textContent: attributes.textContent || '',
    innerHTML: '',
    outerHTML: `<${tagName}${Object.entries(attributes).map(([k, v]) => ` ${k}="${v}"`).join('')}></${tagName}>`,
    matches: jest.fn(),
    closest: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    previousElementSibling: null,
    nextElementSibling: null
  } as unknown as HTMLElement;

  return element;
};

// Mock XPathResult for document.evaluate
const createMockXPathResult = (elements: HTMLElement[]) => ({
  resultType: XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
  snapshotLength: elements.length,
  snapshotItem: jest.fn((index: number) => elements[index] || null)
});

describe('XPathGenerator', () => {
  let generator: XPathGenerator;
  let mockDoc: Document;

  beforeEach(() => {
    generator = new XPathGenerator();
    mockDoc = mockDocument as unknown as Document;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('generateXPath', () => {
    it('should generate XPath using element ID when available', () => {
      // Arrange
      const element = createMockElement({ id: 'unique-button' }, 'button');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      expect(result.selector).toBe('//button[@id="unique-button"]');
      expect(result.confidence.score).toBeGreaterThan(90);
      expect(result.isUnique).toBe(true);
      expect(result.isStable).toBe(true);
    });

    it('should generate XPath using element attributes when ID is not available', () => {
      // Arrange
      const element = createMockElement({
        name: 'username',
        type: 'text'
      }, 'input');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      expect(result.selector).toBe('//input[@name="username"]');
      expect(result.confidence.score).toBeGreaterThan(70);
      expect(result.isUnique).toBe(true);
    });

    it('should generate XPath using class attributes', () => {
      // Arrange
      const element = createMockElement({ class: 'btn btn-primary' }, 'button');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      expect(result.selector).toBe('//button[contains(@class, "btn") and contains(@class, "btn-primary")]');
      expect(result.confidence.score).toBeGreaterThan(60);
      expect(result.confidence.score).toBeLessThan(90);
    });

    it('should generate XPath using text content when other attributes are not available', () => {
      // Arrange
      const element = createMockElement({ textContent: 'Click Me' }, 'button');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      expect(result.selector).toBe('//button[text()="Click Me"]');
      expect(result.confidence.score).toBeGreaterThan(50);
      expect(result.confidence.score).toBeLessThan(80);
    });

    it('should generate XPath using element position when no unique attributes exist', () => {
      // Arrange
      const parentDiv = createMockElement({ class: 'container' }, 'div');
      const element = createMockElement({}, 'button');
      Object.defineProperty(element, 'parentElement', { value: parentDiv, writable: true });

      // Mock siblings for position calculation
      const sibling1 = createMockElement({}, 'button');
      const sibling2 = createMockElement({}, 'button');
      Object.defineProperty(parentDiv, 'children', {
        value: [sibling1, element, sibling2],
        writable: true
      });

      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      expect(result.selector).toBe('//div[contains(@class, "container")]/button[2]');
      expect(result.confidence.score).toBeLessThan(60);
      expect(result.isStable).toBe(false);
    });

    it('should generate absolute XPath as fallback', () => {
      // Arrange
      const element = createMockElement({}, 'span');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      expect(result.selector).toBe('//span');
      expect(result.confidence.score).toBeLessThan(40);
      expect(result.isStable).toBe(false);
    });

    it('should optimize XPath by removing redundant conditions', () => {
      // Arrange
      const element = createMockElement({
        id: 'btn-1',
        class: 'button',
        type: 'submit'
      }, 'button');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      // Should prefer ID over other attributes for optimization
      expect(result.selector).toBe('//button[@id="btn-1"]');
      expect(result.confidence.score).toBeGreaterThan(90);
    });
  });

  describe('validateXPathUniqueness', () => {
    it('should return true when XPath matches only the target element', () => {
      // Arrange
      const element = createMockElement({ id: 'unique-id' });
      const xpath = '//div[@id="unique-id"]';
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const isUnique = generator.validateXPathUniqueness(xpath, element, mockDoc);

      // Assert
      expect(isUnique).toBe(true);
      expect(mockDoc.evaluate).toHaveBeenCalledWith(
        xpath,
        mockDoc,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
    });

    it('should return false when XPath matches multiple elements', () => {
      // Arrange
      const element1 = createMockElement({ class: 'btn' });
      const element2 = createMockElement({ class: 'btn' });
      const xpath = '//div[contains(@class, "btn")]';
      const mockResult = createMockXPathResult([element1, element2]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const isUnique = generator.validateXPathUniqueness(xpath, element1, mockDoc);

      // Assert
      expect(isUnique).toBe(false);
    });

    it('should handle XPath evaluation errors gracefully', () => {
      // Arrange
      const element = createMockElement({ id: 'test' });
      const xpath = '//div[@id="test"]';
      mockDoc.evaluate = jest.fn().mockImplementation(() => {
        throw new Error('XPath evaluation failed');
      });

      // Act
      const isUnique = generator.validateXPathUniqueness(xpath, element, mockDoc);

      // Assert
      expect(isUnique).toBe(false);
    });
  });

  describe('calculateXPathStability', () => {
    it('should give high stability score for ID-based XPath', () => {
      // Arrange
      const xpath = '//button[@id="submit-btn"]';

      // Act
      const score = generator.calculateXPathStability(xpath);

      // Assert
      expect(score).toBeGreaterThan(90);
    });

    it('should give medium stability score for attribute-based XPath', () => {
      // Arrange
      const xpath = '//input[@name="username"]';

      // Act
      const score = generator.calculateXPathStability(xpath);

      // Assert
      expect(score).toBeGreaterThan(70);
      expect(score).toBeLessThan(90);
    });

    it('should give low stability score for class-based XPath', () => {
      // Arrange
      const xpath = '//div[contains(@class, "container")]';

      // Act
      const score = generator.calculateXPathStability(xpath);

      // Assert
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThan(80);
    });

    it('should give very low stability score for position-based XPath', () => {
      // Arrange
      const xpath = '//div[1]/span[2]/button[3]';

      // Act
      const score = generator.calculateXPathStability(xpath);

      // Assert
      expect(score).toBeLessThan(40);
    });

    it('should give lowest stability score for absolute position XPath', () => {
      // Arrange
      const xpath = '/html/body/div[1]/div[2]/span[1]';

      // Act
      const score = generator.calculateXPathStability(xpath);

      // Assert
      expect(score).toBeLessThan(20);
    });
  });

  describe('generateXPathConfidence', () => {
    it('should generate high confidence score for unique ID-based XPath', () => {
      // Arrange
      const xpath = '//button[@id="submit-button"]';
      const isUnique = true;
      const stabilityScore = 95;

      // Act
      const confidence = generator.generateXPathConfidence(xpath, isUnique, stabilityScore);

      // Assert
      expect(confidence.score).toBeGreaterThan(90);
      expect(confidence.factors).toContainEqual(
        expect.objectContaining({
          factor: 'ID-based XPath',
          impact: 'positive'
        })
      );
      expect(confidence.warnings).toHaveLength(0);
    });

    it('should generate medium confidence score for attribute-based XPath', () => {
      // Arrange
      const xpath = '//input[@name="email"]';
      const isUnique = true;
      const stabilityScore = 75;

      // Act
      const confidence = generator.generateXPathConfidence(xpath, isUnique, stabilityScore);

      // Assert
      expect(confidence.score).toBeGreaterThan(70);
      expect(confidence.score).toBeLessThan(90);
      expect(confidence.factors).toContainEqual(
        expect.objectContaining({
          factor: 'Attribute-based XPath',
          impact: 'positive'
        })
      );
    });

    it('should generate low confidence score with warnings for non-unique XPath', () => {
      // Arrange
      const xpath = '//div[contains(@class, "item")]';
      const isUnique = false;
      const stabilityScore = 60;

      // Act
      const confidence = generator.generateXPathConfidence(xpath, isUnique, stabilityScore);

      // Assert
      expect(confidence.score).toBeLessThan(50);
      expect(confidence.warnings).toContain('XPath matches multiple elements');
    });

    it('should include warning for position-based XPath', () => {
      // Arrange
      const xpath = '//div[1]/span[2]';
      const isUnique = true;
      const stabilityScore = 30;

      // Act
      const confidence = generator.generateXPathConfidence(xpath, isUnique, stabilityScore);

      // Assert
      expect(confidence.warnings).toContain('Uses position-based selectors that may break with DOM changes');
    });

    it('should include warning for absolute XPath', () => {
      // Arrange
      const xpath = '/html/body/div[1]/span';
      const isUnique = true;
      const stabilityScore = 15;

      // Act
      const confidence = generator.generateXPathConfidence(xpath, isUnique, stabilityScore);

      // Assert
      expect(confidence.warnings).toContain('Uses absolute path that is highly fragile');
    });
  });

  describe('error handling', () => {
    it('should handle null element gracefully', () => {
      // Act & Assert
      expect(() => {
        generator.generateXPath(null as any, mockDoc);
      }).toThrow('Element cannot be null or undefined');
    });

    it('should handle null document gracefully', () => {
      // Arrange
      const element = createMockElement({ id: 'test' });

      // Act & Assert
      expect(() => {
        generator.generateXPath(element, null as any);
      }).toThrow('Document cannot be null or undefined');
    });

    it('should handle elements without parent hierarchy', () => {
      // Arrange
      const element = createMockElement({}, 'html');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      expect(result.selector).toBe('//html');
      expect(result.isUnique).toBe(true);
    });
  });

  describe('XPath optimization', () => {
    it('should prefer shorter XPath expressions when equally reliable', () => {
      // Arrange
      const element = createMockElement({
        id: 'btn',
        'data-testid': 'submit-button'
      }, 'button');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      // Should prefer shorter ID-based XPath over data-testid
      expect(result.selector).toBe('//button[@id="btn"]');
    });

    it('should combine multiple class conditions efficiently', () => {
      // Arrange
      const element = createMockElement({ class: 'btn primary large' }, 'button');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      expect(result.selector).toBe('//button[contains(@class, "btn") and contains(@class, "primary") and contains(@class, "large")]');
    });
  });

  describe('integration with LocatorStrategy interface', () => {
    it('should return properly formatted LocatorStrategy object', () => {
      // Arrange
      const element = createMockElement({ id: 'test-button' }, 'button');
      const mockResult = createMockXPathResult([element]);
      mockDoc.evaluate = jest.fn().mockReturnValue(mockResult);

      // Act
      const result = generator.generateXPath(element, mockDoc);

      // Assert
      expect(result).toMatchObject({
        type: 'xpath',
        selector: expect.any(String),
        confidence: expect.objectContaining({
          score: expect.any(Number),
          factors: expect.any(Array),
          warnings: expect.any(Array)
        }),
        explanation: expect.any(String),
        isUnique: expect.any(Boolean),
        isStable: expect.any(Boolean)
      });
    });
  });
});