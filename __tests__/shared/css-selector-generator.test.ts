/**
 * @fileoverview Tests for CSS selector generation functionality
 * 
 * This test suite follows TDD methodology to drive the implementation of
 * CSS selector generation strategies including element attributes, classes,
 * hierarchy, uniqueness validation, and stability scoring.
 * 
 * Requirements covered:
 * - 2.1: CSS locator generation strategy
 * - 3.2: Confidence scoring for locator reliability
 * - 3.4: Uniqueness validation and stability assessment
 */

import { CSSelectorGenerator } from '../../src/shared/css-selector-generator';

// Mock DOM environment setup
const mockDocument = {
    querySelectorAll: jest.fn(),
    querySelector: jest.fn(),
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
        querySelectorAll: jest.fn()
    } as unknown as HTMLElement;

    return element;
};

describe('CSSelectorGenerator', () => {
    let generator: CSSelectorGenerator;
    let mockDoc: Document;

    beforeEach(() => {
        generator = new CSSelectorGenerator();
        mockDoc = mockDocument as unknown as Document;

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('generateCSSSelector', () => {
        it('should generate CSS selector using element ID when available', () => {
            // Arrange
            const element = createMockElement({ id: 'unique-button' }, 'button');
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateCSSSelector(element, mockDoc);

            // Assert
            expect(result.selector).toBe('#unique-button');
            expect(result.confidence.score).toBeGreaterThan(90);
            expect(result.isUnique).toBe(true);
            expect(result.isStable).toBe(true);
        });

        it('should generate CSS selector using class names when ID is not available', () => {
            // Arrange
            const element = createMockElement({ class: 'btn btn-primary' }, 'button');
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateCSSSelector(element, mockDoc);

            // Assert
            expect(result.selector).toBe('button.btn.btn-primary');
            expect(result.confidence.score).toBeGreaterThan(60);
            expect(result.confidence.score).toBeLessThan(90);
        });

        it('should generate CSS selector using element hierarchy when simple selectors are not unique', () => {
            // Arrange
            const parentDiv = createMockElement({ class: 'container' }, 'div');
            const element = createMockElement({ class: 'btn' }, 'button');
            Object.defineProperty(element, 'parentElement', { value: parentDiv, writable: true });

            // Mock multiple elements with same class
            mockDoc.querySelectorAll = jest.fn()
                .mockReturnValueOnce([element, createMockElement({ class: 'btn' }, 'button')]) // Multiple .btn elements
                .mockReturnValueOnce([element]); // Unique with hierarchy

            // Act
            const result = generator.generateCSSSelector(element, mockDoc);

            // Assert
            expect(result.selector).toBe('div.container > button.btn');
            expect(result.isUnique).toBe(true);
        });

        it('should generate CSS selector using tag name as fallback', () => {
            // Arrange
            const element = createMockElement({}, 'input');
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateCSSSelector(element, mockDoc);

            // Assert
            expect(result.selector).toBe('input');
            expect(result.confidence.score).toBeLessThan(50);
            expect(result.isStable).toBe(false);
        });

        it('should generate CSS selector using attribute selectors for form elements', () => {
            // Arrange
            const element = createMockElement({
                name: 'username',
                type: 'text'
            }, 'input');
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateCSSSelector(element, mockDoc);

            // Assert
            expect(result.selector).toBe('input[name="username"]');
            expect(result.confidence.score).toBeGreaterThan(70);
        });
    });

    describe('validateUniqueness', () => {
        it('should return true when selector matches only the target element', () => {
            // Arrange
            const element = createMockElement({ id: 'unique-id' });
            const selector = '#unique-id';
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);

            // Act
            const isUnique = generator.validateUniqueness(selector, element, mockDoc);

            // Assert
            expect(isUnique).toBe(true);
            expect(mockDoc.querySelectorAll).toHaveBeenCalledWith(selector);
        });

        it('should return false when selector matches multiple elements', () => {
            // Arrange
            const element1 = createMockElement({ class: 'btn' });
            const element2 = createMockElement({ class: 'btn' });
            const selector = '.btn';
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element1, element2]);

            // Act
            const isUnique = generator.validateUniqueness(selector, element1, mockDoc);

            // Assert
            expect(isUnique).toBe(false);
        });

        it('should handle DOM query errors gracefully', () => {
            // Arrange
            const element = createMockElement({ id: 'test' });
            const selector = '#test';
            mockDoc.querySelectorAll = jest.fn().mockImplementation(() => {
                throw new Error('DOM query failed');
            });

            // Act
            const isUnique = generator.validateUniqueness(selector, element, mockDoc);

            // Assert
            expect(isUnique).toBe(false);
        });
    });

    describe('calculateStabilityScore', () => {
        it('should give high stability score for ID-based selectors', () => {
            // Arrange
            const selector = '#user-profile-button';

            // Act
            const score = generator.calculateStabilityScore(selector);

            // Assert
            expect(score).toBeGreaterThan(90);
        });

        it('should give medium stability score for semantic class names', () => {
            // Arrange
            const selector = '.navigation-menu';

            // Act
            const score = generator.calculateStabilityScore(selector);

            // Assert
            expect(score).toBeGreaterThan(60);
            expect(score).toBeLessThan(90);
        });

        it('should give low stability score for auto-generated class names', () => {
            // Arrange
            const selector = '.css-1a2b3c4d';

            // Act
            const score = generator.calculateStabilityScore(selector);

            // Assert
            expect(score).toBeLessThan(40);
        });

        it('should give very low stability score for position-based selectors', () => {
            // Arrange
            const selector = 'div:nth-child(3) > span:nth-child(2)';

            // Act
            const score = generator.calculateStabilityScore(selector);

            // Assert
            expect(score).toBeLessThan(30);
        });
    });

    describe('generateConfidenceScore', () => {
        it('should generate high confidence score for unique ID selector', () => {
            // Arrange
            const selector = '#submit-button';
            const isUnique = true;
            const stabilityScore = 95;

            // Act
            const confidence = generator.generateConfidenceScore(selector, isUnique, stabilityScore);

            // Assert
            expect(confidence.score).toBeGreaterThan(90);
            expect(confidence.factors).toContainEqual(
                expect.objectContaining({
                    factor: 'ID selector',
                    impact: 'positive'
                })
            );
            expect(confidence.warnings).toHaveLength(0);
        });

        it('should generate medium confidence score for class-based selector', () => {
            // Arrange
            const selector = '.btn-primary';
            const isUnique = true;
            const stabilityScore = 70;

            // Act
            const confidence = generator.generateConfidenceScore(selector, isUnique, stabilityScore);

            // Assert
            expect(confidence.score).toBeGreaterThan(60);
            expect(confidence.score).toBeLessThan(90);
            expect(confidence.factors).toContainEqual(
                expect.objectContaining({
                    factor: 'Class selector',
                    impact: 'positive'
                })
            );
        });

        it('should generate low confidence score with warnings for non-unique selector', () => {
            // Arrange
            const selector = '.btn';
            const isUnique = false;
            const stabilityScore = 60;

            // Act
            const confidence = generator.generateConfidenceScore(selector, isUnique, stabilityScore);

            // Assert
            expect(confidence.score).toBeLessThan(50);
            expect(confidence.warnings).toContain('Selector matches multiple elements');
        });

        it('should include warning for auto-generated class names', () => {
            // Arrange
            const selector = '.css-1a2b3c4d';
            const isUnique = true;
            const stabilityScore = 30;

            // Act
            const confidence = generator.generateConfidenceScore(selector, isUnique, stabilityScore);

            // Assert
            expect(confidence.warnings).toContain('Contains auto-generated class names that may change');
        });
    });

    describe('error handling', () => {
        it('should handle null element gracefully', () => {
            // Act & Assert
            expect(() => {
                generator.generateCSSSelector(null as any, mockDoc);
            }).toThrow('Element cannot be null or undefined');
        });

        it('should handle null document gracefully', () => {
            // Arrange
            const element = createMockElement({ id: 'test' });

            // Act & Assert
            expect(() => {
                generator.generateCSSSelector(element, null as any);
            }).toThrow('Document cannot be null or undefined');
        });

        it('should handle elements without parent hierarchy', () => {
            // Arrange
            const element = createMockElement({}, 'html');
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateCSSSelector(element, mockDoc);

            // Assert
            expect(result.selector).toBe('html');
            expect(result.isUnique).toBe(true);
        });
    });

    describe('integration with LocatorStrategy interface', () => {
        it('should return properly formatted LocatorStrategy object', () => {
            // Arrange
            const element = createMockElement({ id: 'test-button' }, 'button');
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateCSSSelector(element, mockDoc);

            // Assert
            expect(result).toMatchObject({
                type: 'css',
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