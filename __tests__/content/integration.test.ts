/**
 * @fileoverview Integration tests for locator display and copy functionality
 * 
 * This test suite verifies that OnPagePopup and ElementSelector work together
 * to provide the complete locator display and copy functionality as specified
 * in Task 5.4.
 * 
 * Requirements Coverage:
 * - 1.4: Copy highest-rated locator on element click
 * - 2.2: Copy button functionality for locators
 * - 5.1: Locator display in on-page popup
 */

import { OnPagePopup } from '../../src/content/on-page-popup';
import { ElementSelector } from '../../src/content/element-selector';
import { LocatorStrategy } from '../../src/shared/data-models';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  }
});

// Mock CSS selector generator
jest.mock('../../src/shared/css-selector-generator', () => ({
  CSSelectorGenerator: jest.fn().mockImplementation(() => ({
    generateCSSSelector: jest.fn().mockReturnValue({
      type: 'css',
      selector: '#integration-test-button',
      confidence: { score: 90, factors: [], warnings: [] },
      explanation: 'Uses unique ID',
      isUnique: true,
      isStable: true
    })
  }))
}));

describe('Locator Display and Copy Integration', () => {
  let popup: OnPagePopup;
  let elementSelector: ElementSelector;
  let mockElement: HTMLElement;
  let mockStrategies: LocatorStrategy[];

  beforeEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';

    // Create instances
    popup = new OnPagePopup();
    elementSelector = new ElementSelector();

    // Create mock element
    mockElement = document.createElement('button');
    mockElement.id = 'integration-test-button';
    mockElement.textContent = 'Test Button';
    document.body.appendChild(mockElement);

    // Create mock strategies (sorted by confidence)
    mockStrategies = [
      {
        type: 'css',
        selector: '#integration-test-button',
        confidence: { score: 95, factors: [], warnings: [] },
        explanation: 'Unique ID selector',
        isUnique: true,
        isStable: true
      },
      {
        type: 'xpath',
        selector: '//button[@id="integration-test-button"]',
        confidence: { score: 85, factors: [], warnings: [] },
        explanation: 'XPath with ID',
        isUnique: true,
        isStable: true
      }
    ];
  });

  afterEach(() => {
    popup.hide();
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Complete Workflow Integration', () => {
    test('should display locators and enable copy functionality', async () => {
      // Arrange
      const mockCopyCallback = jest.fn();
      popup.onCopy(mockCopyCallback);

      // Act - Show popup with locators
      popup.show({ x: 100, y: 100 }, mockStrategies);

      // Assert - Popup is displayed with locators
      const popupElement = document.getElementById('locateflow-popup');
      expect(popupElement).toBeTruthy();

      const locatorItems = popupElement?.querySelectorAll('.locator-item');
      expect(locatorItems).toHaveLength(2);

      // Act - Click copy button for first locator
      const firstCopyButton = document.querySelector('.copy-button') as HTMLButtonElement;
      firstCopyButton.click();

      // Assert - Copy callback was called with correct data
      expect(mockCopyCallback).toHaveBeenCalledWith('#integration-test-button', 'css');
    });

    test('should auto-copy highest-rated locator on element click without Ctrl', async () => {
      // Act - Simulate element click without Ctrl
      elementSelector.handleElementClick(mockElement, false);

      // Assert - Highest-rated locator was copied to clipboard
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#integration-test-button');
    });

    test('should not auto-copy when Ctrl key is held', async () => {
      // Act - Simulate element click with Ctrl
      elementSelector.handleElementClick(mockElement, true);

      // Assert - No clipboard copy occurred
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    test('should handle popup copy callback integration with clipboard API', async () => {
      // Arrange
      popup.onCopy(async (selector) => {
        await popup.copyToClipboard(selector);
      });

      // Act
      popup.show({ x: 100, y: 100 }, mockStrategies);
      const firstCopyButton = document.querySelector('.copy-button') as HTMLButtonElement;
      firstCopyButton.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#integration-test-button');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle clipboard errors gracefully in complete workflow', async () => {
      // Arrange - Mock clipboard to fail
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error('Clipboard access denied')
      );

      // Act & Assert - Should not throw
      await expect(async () => {
        elementSelector.handleElementClick(mockElement, false);
      }).not.toThrow();

      await expect(async () => {
        await popup.copyToClipboard('#test-selector');
      }).not.toThrow();
    });

    test('should handle empty strategies gracefully', () => {
      // Act
      popup.show({ x: 100, y: 100 }, []);
      const highestRated = popup.getHighestRatedLocator([]);

      // Assert
      const locatorItems = document.querySelectorAll('.locator-item');
      expect(locatorItems).toHaveLength(0);
      expect(highestRated).toBe('');
    });
  });

  describe('Requirements Verification', () => {
    test('should satisfy Requirement 1.4: Copy highest-rated locator on element click', async () => {
      // This test verifies that clicking an element (without Ctrl) copies the highest-rated locator

      // Act
      elementSelector.handleElementClick(mockElement, false);

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#integration-test-button');
    });

    test('should satisfy Requirement 2.2: Copy button functionality for locators', () => {
      // This test verifies that each locator has a copy button that works

      // Arrange
      const mockCopyCallback = jest.fn();
      popup.onCopy(mockCopyCallback);

      // Act
      popup.show({ x: 100, y: 100 }, mockStrategies);

      // Assert - Copy buttons exist
      const copyButtons = document.querySelectorAll('.copy-button');
      expect(copyButtons).toHaveLength(2);

      // Act - Click each copy button
      (copyButtons[0] as HTMLButtonElement).click();
      (copyButtons[1] as HTMLButtonElement).click();

      // Assert - Callbacks were called with correct data
      expect(mockCopyCallback).toHaveBeenCalledWith('#integration-test-button', 'css');
      expect(mockCopyCallback).toHaveBeenCalledWith('//button[@id="integration-test-button"]', 'xpath');
    });

    test('should satisfy Requirement 5.1: Locator display in on-page popup', () => {
      // This test verifies that locators are properly displayed in the popup

      // Act
      popup.show({ x: 100, y: 100 }, mockStrategies);

      // Assert - Popup displays all locator information
      const popupElement = document.getElementById('locateflow-popup');
      expect(popupElement).toBeTruthy();

      // Check locator types are displayed
      const typeElements = popupElement?.querySelectorAll('.locator-type');
      expect(typeElements?.[0].textContent).toBe('CSS');
      expect(typeElements?.[1].textContent).toBe('XPATH');

      // Check selectors are displayed
      const selectorElements = popupElement?.querySelectorAll('.locator-selector');
      expect(selectorElements?.[0].textContent).toBe('#integration-test-button');
      expect(selectorElements?.[1].textContent).toBe('//button[@id="integration-test-button"]');

      // Check confidence scores are displayed
      const scoreElements = popupElement?.querySelectorAll('.confidence-score');
      expect(scoreElements?.[0].textContent).toBe('95%');
      expect(scoreElements?.[1].textContent).toBe('85%');
    });
  });
});