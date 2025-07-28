import { OnPagePopup } from '../../src/content/on-page-popup';
import { LocatorStrategy } from '../../src/shared/data-models';

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(() => Promise.resolve())
    }
});

describe('OnPagePopup - Locator Display and Copy Functionality', () => {
    let popup: OnPagePopup;
    let mockStrategies: LocatorStrategy[];

    beforeEach(() => {
        popup = new OnPagePopup();

        // Create mock locator strategies for testing
        mockStrategies = [
            {
                type: 'css',
                selector: '#submit-button',
                confidence: {
                    score: 95,
                    factors: [],
                    warnings: []
                },
                explanation: 'Unique ID selector',
                isUnique: true,
                isStable: true
            },
            {
                type: 'xpath',
                selector: '//button[@id="submit-button"]',
                confidence: {
                    score: 85,
                    factors: [],
                    warnings: []
                },
                explanation: 'XPath with ID',
                isUnique: true,
                isStable: true
            },
            {
                type: 'class',
                selector: '.btn-primary',
                confidence: {
                    score: 60,
                    factors: [],
                    warnings: ['May not be unique']
                },
                explanation: 'Class-based selector',
                isUnique: false,
                isStable: false
            }
        ];

        // Clean up DOM before each test
        document.body.innerHTML = '';
    });

    afterEach(() => {
        popup.hide();
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Locator List Rendering', () => {
        test('should render locator list with all strategies', () => {
            // Act
            popup.show({ x: 100, y: 100 }, mockStrategies);

            // Assert
            const popupElement = document.getElementById('locateflow-popup');
            expect(popupElement).toBeTruthy();

            const locatorItems = popupElement?.querySelectorAll('.locator-item');
            expect(locatorItems).toHaveLength(3);
        });

        test('should display locator type, selector, and confidence score for each strategy', () => {
            // Act
            popup.show({ x: 100, y: 100 }, mockStrategies);

            // Assert
            const locatorItems = document.querySelectorAll('.locator-item');

            // Check first locator (CSS)
            const firstItem = locatorItems[0];
            expect(firstItem.querySelector('.locator-type')?.textContent).toBe('CSS');
            expect(firstItem.querySelector('.locator-selector')?.textContent).toBe('#submit-button');
            expect(firstItem.querySelector('.confidence-score')?.textContent).toBe('95%');
        });

        test('should render copy button for each locator strategy', () => {
            // Act
            popup.show({ x: 100, y: 100 }, mockStrategies);

            // Assert
            const copyButtons = document.querySelectorAll('.copy-button');
            expect(copyButtons).toHaveLength(3);

            // Check button attributes
            const firstButton = copyButtons[0] as HTMLButtonElement;
            expect(firstButton.dataset.selector).toBe('#submit-button');
            expect(firstButton.dataset.type).toBe('css');
            expect(firstButton.textContent?.trim()).toBe('Copy');
        });

        test('should handle empty strategies array gracefully', () => {
            // Act
            popup.show({ x: 100, y: 100 }, []);

            // Assert
            const popupElement = document.getElementById('locateflow-popup');
            expect(popupElement).toBeTruthy();

            const locatorItems = popupElement?.querySelectorAll('.locator-item');
            expect(locatorItems).toHaveLength(0);
        });
    });

    describe('Copy Button Functionality', () => {
        test('should call copy callback when copy button is clicked', () => {
            // Arrange
            const mockCopyCallback = jest.fn();
            popup.onCopy(mockCopyCallback);
            popup.show({ x: 100, y: 100 }, mockStrategies);

            // Act
            const firstCopyButton = document.querySelector('.copy-button') as HTMLButtonElement;
            firstCopyButton.click();

            // Assert
            expect(mockCopyCallback).toHaveBeenCalledWith('#submit-button', 'css');
        });

        test('should copy correct selector and type for each strategy', () => {
            // Arrange
            const mockCopyCallback = jest.fn();
            popup.onCopy(mockCopyCallback);
            popup.show({ x: 100, y: 100 }, mockStrategies);

            // Act - click second copy button (XPath)
            const copyButtons = document.querySelectorAll('.copy-button');
            (copyButtons[1] as HTMLButtonElement).click();

            // Assert
            expect(mockCopyCallback).toHaveBeenCalledWith('//button[@id="submit-button"]', 'xpath');
        });

        test('should handle copy button click when no callback is registered', () => {
            // Arrange
            popup.show({ x: 100, y: 100 }, mockStrategies);

            // Act & Assert - should not throw error
            expect(() => {
                const firstCopyButton = document.querySelector('.copy-button') as HTMLButtonElement;
                firstCopyButton.click();
            }).not.toThrow();
        });
    });

    describe('Clipboard API Integration', () => {
        test('should copy text to clipboard using navigator.clipboard.writeText', async () => {
            // Arrange
            const testText = '#submit-button';

            // Act
            await popup.copyToClipboard(testText);

            // Assert
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
        });

        test('should handle clipboard API errors gracefully', async () => {
            // Arrange
            const mockError = new Error('Clipboard access denied');
            (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(mockError);

            // Act & Assert - should not throw
            await expect(popup.copyToClipboard('test')).resolves.not.toThrow();
        });
    });

    describe('Highest-Rated Locator Auto-Copy', () => {
        test('should identify highest-rated locator from strategies', () => {
            // Act
            const highestRated = popup.getHighestRatedLocator(mockStrategies);

            // Assert - should return CSS selector with 95% confidence
            expect(highestRated).toBe('#submit-button');
        });

        test('should return empty string when no strategies provided', () => {
            // Act
            const highestRated = popup.getHighestRatedLocator([]);

            // Assert
            expect(highestRated).toBe('');
        });

        test('should auto-copy highest-rated locator on element click without Ctrl', async () => {
            // Arrange
            const mockElement = document.createElement('button');
            mockElement.id = 'submit-button';

            // Act
            await popup.autoCopyHighestRatedLocator(mockStrategies);

            // Assert
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#submit-button');
        });
    });

    describe('Integration Tests', () => {
        test('should display locators and enable copy functionality in complete workflow', () => {
            // Arrange
            const mockCopyCallback = jest.fn();
            popup.onCopy(mockCopyCallback);

            // Act
            popup.show({ x: 100, y: 100 }, mockStrategies);
            const firstCopyButton = document.querySelector('.copy-button') as HTMLButtonElement;
            firstCopyButton.click();

            // Assert
            expect(document.getElementById('locateflow-popup')).toBeTruthy();
            expect(document.querySelectorAll('.locator-item')).toHaveLength(3);
            expect(mockCopyCallback).toHaveBeenCalledWith('#submit-button', 'css');
        });
    });
});