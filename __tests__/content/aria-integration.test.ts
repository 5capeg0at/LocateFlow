/**
 * @fileoverview Test suite for ARIA functionality integration with main workflow
 * 
 * This test suite follows Test-Driven Development (TDD) methodology with
 * Red-Green-Refactor cycles. Tests cover ARIA tab integration in on-page popup,
 * ARIA locator suggestions in main locators tab, and ARIA-focused confidence scoring.
 * 
 * Requirements Coverage:
 * - Requirement 4.1: Dedicated ARIA tab in on-page popup
 * - Requirement 4.2: ARIA locator suggestions in main locators tab
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import { JSDOM } from 'jsdom';
import { OnPagePopup } from '../../src/content/on-page-popup';
import { ElementSelector } from '../../src/content/element-selector';
import { AriaAnalysisEngine } from '../../src/shared/aria-analysis-engine';
import { AriaLocatorGenerator } from '../../src/shared/aria-locator-generator';
import { LocatorStrategy } from '../../src/shared/data-models';

// Mock DOM environment setup
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

global.document = dom.window.document;
global.window = dom.window as any;
global.navigator = {
    clipboard: {
        writeText: jest.fn(() => Promise.resolve())
    }
} as any;

// Mock window.open for ARIA analysis engine
const mockWindowOpen = jest.fn();
global.window.open = mockWindowOpen;

describe('ARIA Integration with Main Workflow', () => {
    let popup: OnPagePopup;
    let elementSelector: ElementSelector;
    let ariaEngine: AriaAnalysisEngine;
    let ariaGenerator: AriaLocatorGenerator;
    let mockWindow: any;

    beforeEach(() => {
        // Set up DOM content for each test
        document.body.innerHTML = `
      <button id="submit-btn" aria-label="Submit form" role="button">Submit</button>
      <input type="text" aria-label="Username" aria-required="true" name="username">
      <div role="dialog" aria-labelledby="dialog-title">
        <h2 id="dialog-title">Confirmation Dialog</h2>
        <button aria-label="Close dialog">Close</button>
      </div>
    `;

        mockWindow = {
            document: {
                write: jest.fn(),
                close: jest.fn()
            },
            focus: jest.fn(),
            close: jest.fn()
        };

        mockWindowOpen.mockReturnValue(mockWindow);

        popup = new OnPagePopup();
        elementSelector = new ElementSelector();
        ariaEngine = new AriaAnalysisEngine();
        ariaGenerator = new AriaLocatorGenerator();

        jest.clearAllMocks();
    });

    afterEach(() => {
        popup.hide();
        document.body.innerHTML = '';
    });

    describe('ARIA Tab Integration in On-Page Popup', () => {
        test('should display ARIA snapshot generation button in ARIA tab', () => {
            // Arrange
            const strategies: LocatorStrategy[] = [];

            // Act
            popup.show({ x: 100, y: 100 }, strategies);
            const ariaTab = document.querySelector('[data-tab-id="aria"]') as HTMLElement;
            ariaTab.click();

            // Assert
            const ariaContent = document.getElementById('locateflow-content-aria');
            expect(ariaContent?.style.display).toBe('block');
            expect(ariaContent?.innerHTML).toContain('Generate ARIA Snapshot');
        });

        test('should generate ARIA snapshot when button is clicked', () => {
            // Arrange
            const element = document.getElementById('submit-btn') as HTMLElement;
            const strategies: LocatorStrategy[] = [];
            // Spy on the popup's ARIA generator using public testing API
            const mockGenerateSnapshot = jest.spyOn(popup.getAriaGeneratorForTesting(), 'generateAriaSnapshot');

            // Act
            popup.show({ x: 100, y: 100 }, strategies, element);
            const ariaTab = document.querySelector('[data-tab-id="aria"]') as HTMLElement;
            ariaTab.click();

            // Test the ARIA snapshot generation functionality
            popup.generateAriaSnapshotForTesting(element);

            // Assert
            expect(mockGenerateSnapshot).toHaveBeenCalledWith(element);
        });

        test('should display ARIA snapshot in new window when generated', () => {
            // Arrange
            const element = document.getElementById('submit-btn') as HTMLElement;
            const strategies: LocatorStrategy[] = [];
            // Spy on the popup's ARIA engine using public testing API
            const mockDisplaySnapshot = jest.spyOn(popup.getAriaEngineForTesting(), 'displaySnapshotInNewWindow');

            // Act
            popup.show({ x: 100, y: 100 }, strategies, element);

            // Test the ARIA snapshot generation functionality
            popup.generateAriaSnapshotForTesting(element);

            // Assert
            expect(mockDisplaySnapshot).toHaveBeenCalled();
            expect(mockWindowOpen).toHaveBeenCalledWith(
                '',
                'aria-snapshot',
                'width=800,height=600,scrollbars=yes,resizable=yes'
            );
        });

        test('should show ARIA locator suggestions in ARIA tab', () => {
            // Arrange
            const element = document.getElementById('submit-btn') as HTMLElement;
            const strategies: LocatorStrategy[] = [];

            // Act
            popup.show({ x: 100, y: 100 }, strategies, element);
            const ariaTab = document.querySelector('[data-tab-id="aria"]') as HTMLElement;
            ariaTab.click();

            // Assert
            const ariaContent = document.getElementById('locateflow-content-aria');
            expect(ariaContent?.innerHTML).toContain('ARIA Locators');
            expect(ariaContent?.innerHTML).toContain('[aria-label="Submit form"]');
            expect(ariaContent?.innerHTML).toContain('[role="button"]');
        });

        test('should handle elements without ARIA attributes gracefully', () => {
            // Arrange
            const element = document.createElement('div');
            document.body.appendChild(element);
            const strategies: LocatorStrategy[] = [];

            // Act
            popup.show({ x: 100, y: 100 }, strategies, element);
            const ariaTab = document.querySelector('[data-tab-id="aria"]') as HTMLElement;
            ariaTab.click();

            // Assert
            const ariaContent = document.getElementById('locateflow-content-aria');
            expect(ariaContent?.innerHTML).toContain('No ARIA attributes found');
        });
    });

    describe('ARIA Locator Suggestions in Main Locators Tab', () => {
        test('should include ARIA locators in main locators list', () => {
            // Arrange
            const element = document.getElementById('submit-btn') as HTMLElement;

            // Act
            const locatorData = elementSelector.createLocatorData(element, 'http://test.com');
            const strategies = locatorData.strategies;

            // Assert
            const ariaStrategies = strategies.filter(s => s.type === 'aria');
            expect(ariaStrategies.length).toBeGreaterThan(0);
            expect(ariaStrategies.some(s => s.selector.includes('aria-label'))).toBe(true);
            expect(ariaStrategies.some(s => s.selector.includes('role'))).toBe(true);
        });

        test('should prioritize ARIA locators with high confidence scores', () => {
            // Arrange
            const element = document.querySelector('input[aria-label="Username"]') as HTMLElement;

            // Act
            const locatorData = elementSelector.createLocatorData(element, 'http://test.com');
            const strategies = locatorData.strategies;

            // Assert
            const ariaStrategy = strategies.find(s => s.type === 'aria' && s.selector.includes('aria-label'));
            expect(ariaStrategy).toBeDefined();
            expect(ariaStrategy!.confidence.score).toBeGreaterThan(70);
        });

        test('should show ARIA locators in popup display', () => {
            // Arrange
            const element = document.getElementById('submit-btn') as HTMLElement;
            const locatorData = elementSelector.createLocatorData(element, 'http://test.com');

            // Act
            popup.show({ x: 100, y: 100 }, locatorData.strategies);

            // Assert
            const locatorsList = document.querySelector('.locateflow-locators');
            expect(locatorsList?.innerHTML).toContain('ARIA');
            expect(locatorsList?.innerHTML).toContain('[aria-label="Submit form"]');
        });

        test('should allow copying ARIA locators from main tab', () => {
            // Arrange
            const element = document.getElementById('submit-btn') as HTMLElement;
            const locatorData = elementSelector.createLocatorData(element, 'http://test.com');
            const mockCopyCallback = jest.fn();
            popup.onCopy(mockCopyCallback);

            // Act
            popup.show({ x: 100, y: 100 }, locatorData.strategies);
            const ariaCopyButton = Array.from(document.querySelectorAll('.copy-button'))
                .find(btn => (btn as HTMLElement).dataset.type === 'aria') as HTMLButtonElement;
            ariaCopyButton?.click();

            // Assert
            expect(mockCopyCallback).toHaveBeenCalledWith(
                expect.stringContaining('aria-label'),
                'aria'
            );
        });
    });

    describe('ARIA-Focused Confidence Scoring Adjustments', () => {
        test('should boost confidence scores for elements with good ARIA attributes', () => {
            // Arrange
            const element = document.querySelector('input[aria-label="Username"]') as HTMLElement;

            // Act
            const locatorData = elementSelector.createLocatorData(element, 'http://test.com');
            const ariaStrategy = locatorData.strategies.find(s => s.type === 'aria');

            // Assert
            expect(ariaStrategy).toBeDefined();
            expect(ariaStrategy!.confidence.score).toBeGreaterThan(75);
            expect(ariaStrategy!.confidence.factors.some(f =>
                f.factor.includes('aria-label') && f.impact === 'positive'
            )).toBe(true);
        });

        test('should provide detailed confidence explanations for ARIA locators', () => {
            // Arrange
            const element = document.querySelector('input[aria-required="true"]') as HTMLElement;

            // Act
            const locatorData = elementSelector.createLocatorData(element, 'http://test.com');
            const ariaStrategy = locatorData.strategies.find(s => s.type === 'aria');

            // Assert
            expect(ariaStrategy).toBeDefined();
            expect(ariaStrategy!.confidence.factors.length).toBeGreaterThan(0);
            expect(ariaStrategy!.explanation).toContain('ARIA');
        });

        test('should warn about unreliable ARIA attributes', () => {
            // Arrange
            const element = document.createElement('button');
            element.setAttribute('aria-expanded', 'false');
            document.body.appendChild(element);

            // Act
            const locatorData = elementSelector.createLocatorData(element, 'http://test.com');
            const ariaStrategy = locatorData.strategies.find(s =>
                s.type === 'aria' && s.selector.includes('aria-expanded')
            );

            // Assert
            expect(ariaStrategy).toBeDefined();
            expect(ariaStrategy!.confidence.warnings.length).toBeGreaterThan(0);
            expect(ariaStrategy!.confidence.warnings.some(w =>
                w.includes('may not be reliable')
            )).toBe(true);
        });

        test('should integrate accessibility analysis into confidence scoring', () => {
            // Arrange
            const element = document.getElementById('submit-btn') as HTMLElement;
            const snapshot = ariaGenerator.generateAriaSnapshot(element);

            // Act
            const analysis = ariaEngine.analyzeAccessibility(snapshot);
            const locatorData = elementSelector.createLocatorData(element, 'http://test.com');

            // Assert
            expect(analysis.score).toBeGreaterThan(0);
            expect(analysis.compliance).toBeDefined();

            // ARIA locators should reflect accessibility quality
            const ariaStrategies = locatorData.strategies.filter(s => s.type === 'aria');
            expect(ariaStrategies.length).toBeGreaterThan(0);
        });
    });

    describe('Integration Error Handling', () => {
        test('should handle ARIA generation errors gracefully', () => {
            // Arrange
            const mockError = new Error('ARIA generation failed');
            jest.spyOn(ariaGenerator, 'generateAriaSnapshot').mockImplementation(() => {
                throw mockError;
            });

            // Act & Assert
            expect(() => {
                popup.show({ x: 100, y: 100 }, []);
                const ariaTab = document.querySelector('[data-tab-id="aria"]') as HTMLElement;
                ariaTab.click();
                const generateButton = document.querySelector('[data-action="generate-aria"]') as HTMLButtonElement;
                generateButton.click();
            }).not.toThrow();
        });

        test('should handle missing ARIA elements gracefully', () => {
            // Arrange
            const element = document.createElement('span');
            document.body.appendChild(element);

            // Act
            const locatorData = elementSelector.createLocatorData(element, 'http://test.com');

            // Assert
            const ariaStrategies = locatorData.strategies.filter(s => s.type === 'aria');
            // Should not crash, may have empty ARIA strategies
            expect(Array.isArray(ariaStrategies)).toBe(true);
        });
    });
});