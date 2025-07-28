/**
 * @fileoverview Tests for attribute-based locator generation functionality
 * 
 * This test suite follows TDD methodology to drive the implementation of
 * ID, Class, Name, and Tag locator strategies with confidence scoring
 * based on attribute stability and uniqueness.
 * 
 * Requirements covered:
 * - 2.1: ID, Class, Name, and Tag locator generation strategies
 * - 3.2: Confidence scoring for locator reliability
 * - 3.4: Uniqueness validation and stability assessment
 */

import { AttributeLocatorGenerator } from '../../src/shared/attribute-locator-generator';

// Mock DOM environment setup
const mockDocument = {
    querySelectorAll: jest.fn(),
    querySelector: jest.fn(),
    getElementById: jest.fn(),
    getElementsByClassName: jest.fn(),
    getElementsByName: jest.fn(),
    getElementsByTagName: jest.fn(),
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
        name: attributes.name || '',
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

describe('AttributeLocatorGenerator', () => {
    let generator: AttributeLocatorGenerator;
    let mockDoc: Document;

    beforeEach(() => {
        generator = new AttributeLocatorGenerator();
        mockDoc = mockDocument as unknown as Document;

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('generateIdLocator', () => {
        it('should generate ID locator for element with unique ID', () => {
            // Arrange
            const element = createMockElement({ id: 'submit-button' }, 'button');
            mockDoc.getElementById = jest.fn().mockReturnValue(element);
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateIdLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.selector).toBe('submit-button');
                expect(result.type).toBe('id');
                expect(result.confidence.score).toBeGreaterThan(95);
                expect(result.isUnique).toBe(true);
                expect(result.isStable).toBe(true);
            }
        });

        it('should return null for element without ID', () => {
            // Arrange
            const element = createMockElement({}, 'button');

            // Act
            const result = generator.generateIdLocator(element, mockDoc);

            // Assert
            expect(result).toBeNull();
        });

        it('should return null for element with empty ID', () => {
            // Arrange
            const element = createMockElement({ id: '' }, 'button');

            // Act
            const result = generator.generateIdLocator(element, mockDoc);

            // Assert
            expect(result).toBeNull();
        });

        it('should detect non-unique ID and mark as not unique', () => {
            // Arrange
            const element1 = createMockElement({ id: 'duplicate-id' }, 'div');
            const element2 = createMockElement({ id: 'duplicate-id' }, 'span');
            mockDoc.getElementById = jest.fn().mockReturnValue(element1);
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element1, element2]);

            // Act
            const result = generator.generateIdLocator(element1, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.isUnique).toBe(false);
                expect(result.confidence.warnings).toContain('ID is not unique in the document');
            }
        });

        it('should provide lower confidence for auto-generated IDs', () => {
            // Arrange
            const element = createMockElement({ id: 'auto-gen-123456' }, 'div');
            mockDoc.getElementById = jest.fn().mockReturnValue(element);

            // Act
            const result = generator.generateIdLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.confidence.score).toBeLessThan(90);
                expect(result.confidence.warnings).toContain('ID appears to be auto-generated and may change');
            }
        });
    });

    describe('generateClassLocator', () => {
        it('should generate class locator for element with single class', () => {
            // Arrange
            const element = createMockElement({ class: 'primary-button' }, 'button');
            mockDoc.getElementsByClassName = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateClassLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.selector).toBe('primary-button');
                expect(result.type).toBe('class');
                expect(result.confidence.score).toBeGreaterThan(70);
                expect(result.isUnique).toBe(true);
            }
        });

        it('should generate class locator for element with multiple classes', () => {
            // Arrange
            const element = createMockElement({ class: 'btn btn-primary btn-large' }, 'button');
            mockDoc.getElementsByClassName = jest.fn()
                .mockReturnValueOnce([element, createMockElement({ class: 'btn' })]) // btn not unique
                .mockReturnValueOnce([element]); // btn-primary unique

            // Act
            const result = generator.generateClassLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.selector).toBe('btn-primary');
                expect(result.type).toBe('class');
                expect(result.isUnique).toBe(true);
            }
        });

        it('should return null for element without classes', () => {
            // Arrange
            const element = createMockElement({}, 'button');

            // Act
            const result = generator.generateClassLocator(element, mockDoc);

            // Assert
            expect(result).toBeNull();
        });

        it('should detect non-unique class and mark accordingly', () => {
            // Arrange
            const element1 = createMockElement({ class: 'common-class' }, 'div');
            const element2 = createMockElement({ class: 'common-class' }, 'span');
            mockDoc.getElementsByClassName = jest.fn().mockReturnValue([element1, element2]);

            // Act
            const result = generator.generateClassLocator(element1, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.isUnique).toBe(false);
                expect(result.confidence.warnings).toContain('Class is not unique in the document');
            }
        });

        it('should provide lower confidence for auto-generated classes', () => {
            // Arrange
            const element = createMockElement({ class: 'css-1a2b3c4d' }, 'div');
            mockDoc.getElementsByClassName = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateClassLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.confidence.score).toBeLessThan(50);
                expect(result.confidence.warnings).toContain('Class appears to be auto-generated and may change');
            }
        });

        it('should prefer semantic class names over generic ones', () => {
            // Arrange
            const element = createMockElement({ class: 'btn submit-button active' }, 'button');
            mockDoc.getElementsByClassName = jest.fn()
                .mockReturnValueOnce([element, createMockElement({ class: 'btn' })]) // btn not unique
                .mockReturnValueOnce([element]); // submit-button unique

            // Act
            const result = generator.generateClassLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.selector).toBe('submit-button');
                expect(result.confidence.score).toBeGreaterThan(80);
            }
        });
    });

    describe('generateNameLocator', () => {
        it('should generate name locator for form element with name attribute', () => {
            // Arrange
            const element = createMockElement({ name: 'username' }, 'input');
            mockDoc.getElementsByName = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateNameLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.selector).toBe('username');
                expect(result.type).toBe('name');
                expect(result.confidence.score).toBeGreaterThan(85);
                expect(result.isUnique).toBe(true);
            }
        });

        it('should return null for element without name attribute', () => {
            // Arrange
            const element = createMockElement({}, 'input');

            // Act
            const result = generator.generateNameLocator(element, mockDoc);

            // Assert
            expect(result).toBeNull();
        });

        it('should return null for non-form element with name attribute', () => {
            // Arrange
            const element = createMockElement({ name: 'test' }, 'div');

            // Act
            const result = generator.generateNameLocator(element, mockDoc);

            // Assert
            expect(result).toBeNull();
        });

        it('should detect non-unique name and mark accordingly', () => {
            // Arrange
            const element1 = createMockElement({ name: 'radio-option' }, 'input');
            const element2 = createMockElement({ name: 'radio-option' }, 'input');
            mockDoc.getElementsByName = jest.fn().mockReturnValue([element1, element2]);

            // Act
            const result = generator.generateNameLocator(element1, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.isUnique).toBe(false);
                expect(result.confidence.warnings).toContain('Name is not unique in the document');
            }
        });

        it('should provide high confidence for semantic name attributes', () => {
            // Arrange
            const element = createMockElement({ name: 'email-address' }, 'input');
            mockDoc.getElementsByName = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateNameLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.confidence.score).toBeGreaterThan(90);
                expect(result.isStable).toBe(true);
            }
        });
    });

    describe('generateTagLocator', () => {
        it('should generate tag locator for any element', () => {
            // Arrange
            const element = createMockElement({}, 'button');
            mockDoc.getElementsByTagName = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateTagLocator(element, mockDoc);

            // Assert
            expect(result.selector).toBe('button');
            expect(result.type).toBe('tag');
            expect(result.confidence.score).toBeLessThan(60);
            expect(result.isUnique).toBe(true);
            expect(result.isStable).toBe(false);
        });

        it('should detect non-unique tag and mark accordingly', () => {
            // Arrange
            const element1 = createMockElement({}, 'div');
            const element2 = createMockElement({}, 'div');
            mockDoc.getElementsByTagName = jest.fn().mockReturnValue([element1, element2]);

            // Act
            const result = generator.generateTagLocator(element1, mockDoc);

            // Assert
            expect(result.isUnique).toBe(false);
            expect(result.confidence.warnings).toContain('Tag is not unique in the document');
        });

        it('should provide higher confidence for unique semantic tags', () => {
            // Arrange
            const element = createMockElement({}, 'main');
            mockDoc.getElementsByTagName = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateTagLocator(element, mockDoc);

            // Assert
            expect(result.confidence.score).toBeGreaterThan(70);
            expect(result.isStable).toBe(true);
        });

        it('should provide lower confidence for common tags', () => {
            // Arrange
            const element = createMockElement({}, 'div');
            mockDoc.getElementsByTagName = jest.fn().mockReturnValue([element]);

            // Act
            const result = generator.generateTagLocator(element, mockDoc);

            // Assert
            expect(result.confidence.score).toBeLessThan(50);
            expect(result.isStable).toBe(false);
        });
    });

    describe('generateAllLocators', () => {
        it('should generate all applicable locators for an element', () => {
            // Arrange
            const element = createMockElement({
                id: 'submit-btn',
                class: 'btn btn-primary',
                name: 'submit'
            }, 'button');

            mockDoc.getElementById = jest.fn().mockReturnValue(element);
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);
            mockDoc.getElementsByClassName = jest.fn().mockReturnValue([element]);
            mockDoc.getElementsByName = jest.fn().mockReturnValue([element]);
            mockDoc.getElementsByTagName = jest.fn().mockReturnValue([element]);

            // Act
            const results = generator.generateAllLocators(element, mockDoc);

            // Assert
            expect(results).toHaveLength(4);
            expect(results.map((r: any) => r.type)).toEqual(['id', 'name', 'class', 'tag']);
            expect(results[0].confidence.score).toBeGreaterThan(results[1].confidence.score);
            expect(results[1].confidence.score).toBeGreaterThan(results[2].confidence.score);
            expect(results[2].confidence.score).toBeGreaterThan(results[3].confidence.score);
        });

        it('should only generate applicable locators', () => {
            // Arrange
            const element = createMockElement({ class: 'content' }, 'div');

            mockDoc.getElementsByClassName = jest.fn().mockReturnValue([element]);
            mockDoc.getElementsByTagName = jest.fn().mockReturnValue([element]);

            // Act
            const results = generator.generateAllLocators(element, mockDoc);

            // Assert
            expect(results).toHaveLength(2);
            expect(results.map((r: any) => r.type)).toEqual(['class', 'tag']);
        });

        it('should sort results by confidence score descending', () => {
            // Arrange
            const element = createMockElement({
                id: 'auto-gen-123',
                class: 'semantic-button'
            }, 'button');

            mockDoc.getElementById = jest.fn().mockReturnValue(element);
            mockDoc.querySelectorAll = jest.fn().mockReturnValue([element]);
            mockDoc.getElementsByClassName = jest.fn().mockReturnValue([element]);
            mockDoc.getElementsByTagName = jest.fn().mockReturnValue([element]);

            // Act
            const results = generator.generateAllLocators(element, mockDoc);

            // Assert
            expect(results).toHaveLength(3);
            // Class should have higher confidence than auto-generated ID
            expect(results[0].type).toBe('class');
            expect(results[1].type).toBe('id');
            expect(results[2].type).toBe('tag');
        });
    });

    describe('error handling', () => {
        it('should handle null element gracefully', () => {
            // Act & Assert
            expect(() => {
                generator.generateIdLocator(null as any, mockDoc);
            }).toThrow('Element cannot be null or undefined');
        });

        it('should handle null document gracefully', () => {
            // Arrange
            const element = createMockElement({ id: 'test' });

            // Act & Assert
            expect(() => {
                generator.generateIdLocator(element, null as any);
            }).toThrow('Document cannot be null or undefined');
        });

        it('should handle DOM query errors gracefully', () => {
            // Arrange
            const element = createMockElement({ id: 'test' });
            mockDoc.getElementById = jest.fn().mockImplementation(() => {
                throw new Error('DOM query failed');
            });

            // Act
            const result = generator.generateIdLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result.isUnique).toBe(false);
                expect(result.confidence.warnings).toContain('Unable to validate uniqueness due to DOM query error');
            }
        });
    });

    describe('stability assessment', () => {
        it('should assess ID stability correctly', () => {
            // Arrange
            const stableId = 'user-profile-section';
            const unstableId = 'temp-123456';

            // Act
            const stableScore = generator.assessAttributeStability('id', stableId);
            const unstableScore = generator.assessAttributeStability('id', unstableId);

            // Assert
            expect(stableScore).toBeGreaterThan(90);
            expect(unstableScore).toBeLessThan(50);
        });

        it('should assess class stability correctly', () => {
            // Arrange
            const semanticClass = 'navigation-menu';
            const autoGenClass = 'css-1a2b3c4d';
            const utilityClass = 'mt-4';

            // Act
            const semanticScore = generator.assessAttributeStability('class', semanticClass);
            const autoGenScore = generator.assessAttributeStability('class', autoGenClass);
            const utilityScore = generator.assessAttributeStability('class', utilityClass);

            // Assert
            expect(semanticScore).toBeGreaterThan(80);
            expect(autoGenScore).toBeLessThan(30);
            expect(utilityScore).toBeGreaterThan(60);
            expect(utilityScore).toBeLessThan(80);
        });

        it('should assess name stability correctly', () => {
            // Arrange
            const semanticName = 'email-address';
            const genericName = 'field1';

            // Act
            const semanticScore = generator.assessAttributeStability('name', semanticName);
            const genericScore = generator.assessAttributeStability('name', genericName);

            // Assert
            expect(semanticScore).toBeGreaterThan(85);
            expect(genericScore).toBeLessThan(70);
        });

        it('should assess tag stability correctly', () => {
            // Arrange
            const semanticTag = 'main';
            const commonTag = 'div';

            // Act
            const semanticScore = generator.assessAttributeStability('tag', semanticTag);
            const commonScore = generator.assessAttributeStability('tag', commonTag);

            // Assert
            expect(semanticScore).toBeGreaterThan(70);
            expect(commonScore).toBeLessThan(50);
        });
    });

    describe('integration with LocatorStrategy interface', () => {
        it('should return properly formatted LocatorStrategy objects', () => {
            // Arrange
            const element = createMockElement({ id: 'test-element' }, 'button');
            mockDoc.getElementById = jest.fn().mockReturnValue(element);

            // Act
            const result = generator.generateIdLocator(element, mockDoc);

            // Assert
            expect(result).not.toBeNull();
            if (result) {
                expect(result).toMatchObject({
                    type: 'id',
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
            }
        });
    });
});