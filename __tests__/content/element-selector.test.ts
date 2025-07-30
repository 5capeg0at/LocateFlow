/**
 * @fileoverview Tests for ElementSelector - Element selection and inspection functionality
 * 
 * This test suite covers element selection on hover and click, element data extraction,
 * locator generation triggering, and Ctrl key detection for popup freezing.
 * 
 * Requirements Coverage:
 * - Requirement 1.2: Element selection on hover and click
 * - Requirement 1.4: Copy highest-rated locator on element click
 * - Requirement 1.5: Ctrl key detection for popup freezing functionality
 * 
 * TDD Approach: All tests written before implementation (RED phase)
 */

import { ElementSelector } from '../../src/content/element-selector';

// Mock the CSS selector generator
jest.mock('../../src/shared/css-selector-generator', () => ({
  CSSelectorGenerator: jest.fn().mockImplementation(() => ({
    generateCSSSelector: jest.fn().mockReturnValue({
      type: 'css',
      selector: '#test-element',
      confidence: { score: 95, factors: [], warnings: [] },
      explanation: 'Uses unique ID',
      isUnique: true,
      isStable: true
    })
  }))
}));

describe('ElementSelector', () => {
  let elementSelector: ElementSelector;
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Create mock DOM environment
    document.body.innerHTML = '';

    // Create mock element
    mockElement = document.createElement('button');
    mockElement.id = 'test-button';
    mockElement.textContent = 'Click me';
    mockElement.setAttribute('data-testid', 'submit-btn');
    document.body.appendChild(mockElement);



    // Create fresh instance
    elementSelector = new ElementSelector();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Element Selection on Hover', () => {
    it('should extract element data when element is hovered', () => {
      // RED: This test should fail - extractElementData method doesn't exist yet
      const elementData = elementSelector.extractElementData(mockElement);

      expect(elementData).toBeDefined();
      expect(elementData.tagName).toBe('BUTTON');
      expect(elementData.textContent).toBe('Click me');
      expect(elementData.attributes.id).toBe('test-button');
      expect(elementData.attributes['data-testid']).toBe('submit-btn');
    });

    it('should extract element position information', () => {
      // RED: This test should fail - extractElementData method doesn't exist yet
      // Mock getBoundingClientRect
      mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
        x: 100,
        y: 200,
        width: 150,
        height: 40,
        top: 200,
        left: 100,
        bottom: 240,
        right: 250
      });

      const elementData = elementSelector.extractElementData(mockElement);

      expect(elementData.position).toEqual({
        x: 100,
        y: 200,
        width: 150,
        height: 40,
        top: 200,
        left: 100,
        bottom: 240,
        right: 250
      });
    });

    it('should generate XPath for element', () => {
      // RED: This test should fail - generateXPath method doesn't exist yet
      const xpath = elementSelector.generateXPath(mockElement);

      expect(xpath).toBe('//button[@id="test-button"]');
    });

    it('should handle elements without attributes gracefully', () => {
      // RED: This test should fail - extractElementData method doesn't exist yet
      const plainElement = document.createElement('div');
      document.body.appendChild(plainElement);

      const elementData = elementSelector.extractElementData(plainElement);

      expect(elementData.tagName).toBe('DIV');
      expect(elementData.textContent).toBe('');
      expect(Object.keys(elementData.attributes)).toHaveLength(0);
    });
  });

  describe('Element Selection on Click', () => {
    it('should trigger locator generation when element is clicked without Ctrl', () => {
      // RED: This test should fail - onElementClick method doesn't exist yet
      const mockCallback = jest.fn();
      elementSelector.onElementSelected(mockCallback);

      elementSelector.handleElementClick(mockElement, false);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          elementInfo: expect.objectContaining({
            tagName: 'BUTTON',
            textContent: 'Click me'
          }),
          strategies: expect.arrayContaining([
            expect.objectContaining({
              type: 'css',
              selector: '#test-element'
            })
          ])
        })
      );
    });

    it('should generate multiple locator strategies on element click', () => {
      // RED: This test should fail - generateAllLocators method doesn't exist yet
      const strategies = elementSelector.generateAllLocators(mockElement);

      expect(strategies).toBeInstanceOf(Array);
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies[0]).toHaveProperty('type');
      expect(strategies[0]).toHaveProperty('selector');
      expect(strategies[0]).toHaveProperty('confidence');
    });

    it('should create complete LocatorData object on element selection', () => {
      // RED: This test should fail - createLocatorData method doesn't exist yet
      const locatorData = elementSelector.createLocatorData(mockElement, 'https://example.com');

      expect(locatorData).toHaveProperty('id');
      expect(locatorData).toHaveProperty('timestamp');
      expect(locatorData.url).toBe('https://example.com');
      expect(locatorData.elementInfo.tagName).toBe('BUTTON');
      expect(locatorData.strategies).toBeInstanceOf(Array);
    });

    it('should copy highest-rated locator to clipboard on click without Ctrl', () => {
      // RED: This test should fail - copyToClipboard method doesn't exist yet
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText
        }
      });

      elementSelector.handleElementClick(mockElement, false);

      expect(mockWriteText).toHaveBeenCalledWith('#test-button'); // ID-based CSS selector should be highest rated
    });
  });

  describe('Ctrl Key Detection', () => {
    it('should detect when Ctrl key is held during click', () => {
      // RED: This test should fail - isCtrlKeyPressed method doesn't exist yet
      const mockEvent = new MouseEvent('click', { ctrlKey: true });

      const isCtrlPressed = elementSelector.isCtrlKeyPressed(mockEvent);

      expect(isCtrlPressed).toBe(true);
    });

    it('should detect when Ctrl key is not held during click', () => {
      // RED: This test should fail - isCtrlKeyPressed method doesn't exist yet
      const mockEvent = new MouseEvent('click', { ctrlKey: false });

      const isCtrlPressed = elementSelector.isCtrlKeyPressed(mockEvent);

      expect(isCtrlPressed).toBe(false);
    });

    it('should not copy to clipboard when Ctrl key is held', () => {
      // RED: This test should fail - handleElementClick method doesn't exist yet
      const mockWriteText = jest.fn();
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText
        }
      });

      elementSelector.handleElementClick(mockElement, true);

      expect(mockWriteText).not.toHaveBeenCalled();
    });

    it('should still trigger element selection callback when Ctrl is held', () => {
      // RED: This test should fail - onElementSelected method doesn't exist yet
      const mockCallback = jest.fn();
      elementSelector.onElementSelected(mockCallback);

      elementSelector.handleElementClick(mockElement, true);

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle null element gracefully in extractElementData', () => {
      // RED: This test should fail - extractElementData method doesn't exist yet
      expect(() => {
        elementSelector.extractElementData(null as any);
      }).toThrow('Element cannot be null or undefined');
    });

    it('should handle getBoundingClientRect errors gracefully', () => {
      // RED: This test should fail - extractElementData method doesn't exist yet
      mockElement.getBoundingClientRect = jest.fn().mockImplementation(() => {
        throw new Error('getBoundingClientRect failed');
      });

      expect(() => {
        elementSelector.extractElementData(mockElement);
      }).not.toThrow();
    });

    it('should handle clipboard API errors gracefully', () => {
      // RED: This test should fail - copyToClipboard method doesn't exist yet
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard access denied'));
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText
        }
      });

      expect(() => {
        elementSelector.handleElementClick(mockElement, false);
      }).not.toThrow();
    });

    it('should handle locator generation errors gracefully', () => {
      // RED: This test should fail - generateAllLocators method doesn't exist yet
      // Mock CSS generator to throw error
      const { CSSelectorGenerator } = require('../../src/shared/css-selector-generator');
      CSSelectorGenerator.mockImplementation(() => ({
        generateCSSSelector: jest.fn().mockImplementation(() => {
          throw new Error('CSS generation failed');
        })
      }));

      expect(() => {
        elementSelector.generateAllLocators(mockElement);
      }).not.toThrow();
    });
  });

  describe('Callback Registration', () => {
    it('should allow registering element selection callbacks', () => {
      // RED: This test should fail - onElementSelected method doesn't exist yet
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      elementSelector.onElementSelected(callback1);
      elementSelector.onElementSelected(callback2);

      elementSelector.handleElementClick(mockElement, false);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should allow registering element hover callbacks', () => {
      // RED: This test should fail - onElementHovered method doesn't exist yet
      const callback = jest.fn();
      elementSelector.onElementHovered(callback);

      const elementData = elementSelector.extractElementData(mockElement);
      // Simulate hover triggering callback
      elementSelector.triggerHoverCallbacks(elementData);

      expect(callback).toHaveBeenCalledWith(elementData);
    });
  });

  describe('Integration with Locator Generators', () => {
    it('should integrate with CSS selector generator', () => {
      // RED: This test should fail - generateAllLocators method doesn't exist yet
      const strategies = elementSelector.generateAllLocators(mockElement);

      const cssStrategy = strategies.find((s: any) => s.type === 'css');
      expect(cssStrategy).toBeDefined();
      expect(cssStrategy?.selector).toBe('#test-button'); // Uses element ID as fallback
    });

    it('should sort strategies by confidence score', () => {
      // RED: This test should fail - generateAllLocators method doesn't exist yet
      const strategies = elementSelector.generateAllLocators(mockElement);

      // Strategies should be sorted by confidence score (highest first)
      for (let i = 0; i < strategies.length - 1; i++) {
        expect(strategies[i].confidence.score).toBeGreaterThanOrEqual(
          strategies[i + 1].confidence.score
        );
      }
    });

    it('should return highest-rated locator for clipboard copy', () => {
      // RED: This test should fail - getHighestRatedLocator method doesn't exist yet
      const strategies = elementSelector.generateAllLocators(mockElement);
      const highestRated = elementSelector.getHighestRatedLocator(strategies);

      expect(highestRated).toBe('#test-button'); // ID-based CSS selector should be highest rated
    });
  });
});