/**
 * @fileoverview Test suite for ARIA Analysis Engine
 * 
 * This test suite follows Test-Driven Development (TDD) methodology with
 * Red-Green-Refactor cycles. All tests are written before implementation
 * to ensure comprehensive coverage of ARIA analysis and snapshot display functionality.
 * 
 * Requirements Coverage:
 * - Requirement 4.3: ARIA snapshot generation option in ARIA tab
 * - Requirement 4.4: ARIA snapshot display in new browser window/tab
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import { JSDOM } from 'jsdom';
import { AriaAnalysisEngine } from '../../src/shared/aria-analysis-engine';
import { AriaSnapshot } from '../../src/shared/aria-locator-generator';

// Mock DOM environment setup
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window as any;

// Mock window.open for testing
const mockWindowOpen = jest.fn();
global.window.open = mockWindowOpen;

describe('AriaAnalysisEngine', () => {
    let engine: AriaAnalysisEngine;
    let mockWindow: any;

    beforeEach(() => {
        // Reset DOM and mocks for each test
        document.body.innerHTML = '';
        mockWindowOpen.mockClear();

        // Create mock window object for new window
        mockWindow = {
            document: {
                write: jest.fn(),
                close: jest.fn(),
                head: { appendChild: jest.fn() },
                body: { appendChild: jest.fn() }
            },
            focus: jest.fn(),
            close: jest.fn()
        };

        mockWindowOpen.mockReturnValue(mockWindow);
        engine = new AriaAnalysisEngine();
    });

    describe('ARIA Snapshot Display', () => {
        test('should open new window for ARIA snapshot display', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'button',
                ariaAttributes: { 'aria-label': 'Submit form', 'role': 'button' },
                accessibleName: 'Submit form',
                accessibleDescription: '',
                role: 'button',
                states: ['enabled'],
                hierarchy: ['main', 'form']
            };

            // Act
            engine.displaySnapshotInNewWindow(snapshot);

            // Assert
            expect(mockWindowOpen).toHaveBeenCalledWith(
                '',
                'aria-snapshot',
                'width=800,height=600,scrollbars=yes,resizable=yes'
            );
        });

        test('should generate HTML content for ARIA snapshot', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'input',
                ariaAttributes: {
                    'aria-label': 'Email address',
                    'aria-required': 'true',
                    'role': 'textbox'
                },
                accessibleName: 'Email address',
                accessibleDescription: 'Enter your email address',
                role: 'textbox',
                states: ['required'],
                hierarchy: ['main', 'form', 'fieldset']
            };

            // Act
            const htmlContent = engine.generateSnapshotHTML(snapshot);

            // Assert
            expect(htmlContent).toContain('ARIA Accessibility Snapshot');
            expect(htmlContent).toContain('Email address');
            expect(htmlContent).toContain('aria-label');
            expect(htmlContent).toContain('textbox');
            expect(htmlContent).toContain('required');
            expect(htmlContent).toContain('main → form → fieldset');
        });

        test('should write HTML content to new window document', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'button',
                ariaAttributes: { 'aria-label': 'Close dialog' },
                accessibleName: 'Close dialog',
                accessibleDescription: '',
                role: 'button',
                states: [],
                hierarchy: ['dialog']
            };

            // Act
            engine.displaySnapshotInNewWindow(snapshot);

            // Assert
            expect(mockWindow.document.write).toHaveBeenCalled();
            expect(mockWindow.document.close).toHaveBeenCalled();
            expect(mockWindow.focus).toHaveBeenCalled();
        });

        test('should handle empty ARIA attributes gracefully', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'div',
                ariaAttributes: {},
                accessibleName: '',
                accessibleDescription: '',
                role: 'generic',
                states: [],
                hierarchy: []
            };

            // Act
            const htmlContent = engine.generateSnapshotHTML(snapshot);

            // Assert
            expect(htmlContent).toContain('No ARIA attributes found');
            expect(htmlContent).toContain('generic');
            expect(htmlContent).toContain('No accessible name');
        });

        test('should format ARIA attributes table correctly', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'select',
                ariaAttributes: {
                    'aria-label': 'Choose country',
                    'aria-required': 'true',
                    'aria-expanded': 'false',
                    'role': 'combobox'
                },
                accessibleName: 'Choose country',
                accessibleDescription: '',
                role: 'combobox',
                states: ['required', 'collapsed'],
                hierarchy: ['form']
            };

            // Act
            const htmlContent = engine.generateSnapshotHTML(snapshot);

            // Assert
            expect(htmlContent).toContain('<table');
            expect(htmlContent).toContain('aria-label');
            expect(htmlContent).toContain('Choose country');
            expect(htmlContent).toContain('aria-required');
            expect(htmlContent).toContain('true');
            expect(htmlContent).toContain('combobox');
        });

        test('should include CSS styling for readable display', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'button',
                ariaAttributes: { 'aria-label': 'Test' },
                accessibleName: 'Test',
                accessibleDescription: '',
                role: 'button',
                states: [],
                hierarchy: []
            };

            // Act
            const htmlContent = engine.generateSnapshotHTML(snapshot);

            // Assert
            expect(htmlContent).toContain('<style>');
            expect(htmlContent).toContain('font-family');
            expect(htmlContent).toContain('table');
            expect(htmlContent).toContain('border');
            expect(htmlContent).toContain('</style>');
        });
    });

    describe('ARIA Analysis Features', () => {
        test('should analyze ARIA compliance and provide recommendations', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'button',
                ariaAttributes: { 'role': 'button' },
                accessibleName: '',
                accessibleDescription: '',
                role: 'button',
                states: [],
                hierarchy: []
            };

            // Act
            const analysis = engine.analyzeAccessibility(snapshot);

            // Assert
            expect(analysis.issues).toContain('Missing accessible name');
            expect(analysis.recommendations).toContain('Add aria-label');
            expect(analysis.score).toBeLessThan(100);
        });

        test('should provide high accessibility score for well-formed elements', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'button',
                ariaAttributes: {
                    'aria-label': 'Submit form',
                    'role': 'button',
                    'aria-describedby': 'help-text'
                },
                accessibleName: 'Submit form',
                accessibleDescription: 'Click to submit the form',
                role: 'button',
                states: [],
                hierarchy: ['main', 'form']
            };

            // Act
            const analysis = engine.analyzeAccessibility(snapshot);

            // Assert
            expect(analysis.score).toBeGreaterThan(80);
            expect(analysis.issues).toHaveLength(0);
            expect(analysis.recommendations).toContain('Well-formed');
        });

        test('should detect missing required ARIA attributes', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'input',
                ariaAttributes: { 'type': 'text' },
                accessibleName: '',
                accessibleDescription: '',
                role: 'textbox',
                states: ['required'],
                hierarchy: []
            };

            // Act
            const analysis = engine.analyzeAccessibility(snapshot);

            // Assert
            expect(analysis.issues).toContain('Required field without aria-required');
            expect(analysis.recommendations).toContain('Add aria-required="true"');
        });

        test('should validate role hierarchy consistency', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'li',
                ariaAttributes: { 'role': 'listitem' },
                accessibleName: 'Item 1',
                accessibleDescription: '',
                role: 'listitem',
                states: [],
                hierarchy: ['navigation'] // Missing 'list' parent
            };

            // Act
            const analysis = engine.analyzeAccessibility(snapshot);

            // Assert
            expect(analysis.issues).toContain('Listitem not contained in list');
            expect(analysis.recommendations).toContain('Ensure proper list structure');
        });
    });

    describe('Error Handling', () => {
        test('should handle window.open failure gracefully', () => {
            // Arrange
            mockWindowOpen.mockReturnValue(null);
            const snapshot: AriaSnapshot = {
                element: 'button',
                ariaAttributes: { 'aria-label': 'Test' },
                accessibleName: 'Test',
                accessibleDescription: '',
                role: 'button',
                states: [],
                hierarchy: []
            };

            // Mock alert to verify user-friendly notification
            const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => { });

            // Act
            engine.displaySnapshotInNewWindow(snapshot);

            // Assert - should not throw, should show user-friendly notification
            expect(mockAlert).toHaveBeenCalledWith(
                expect.stringContaining('Unable to open ARIA snapshot window')
            );

            mockAlert.mockRestore();
        });

        test('should handle null snapshot gracefully', () => {
            // Act & Assert
            expect(() => engine.displaySnapshotInNewWindow(null as any)).toThrow('Snapshot cannot be null');
        });

        test('should handle malformed snapshot data', () => {
            // Arrange
            const malformedSnapshot = {
                element: null,
                ariaAttributes: null,
                accessibleName: undefined
            } as any;

            // Act
            const htmlContent = engine.generateSnapshotHTML(malformedSnapshot);

            // Assert
            expect(htmlContent).toContain('Invalid snapshot data');
        });

        test('should handle document write errors gracefully', () => {
            // Arrange
            mockWindow.document.write.mockImplementation(() => {
                throw new Error('Document write failed');
            });

            const snapshot: AriaSnapshot = {
                element: 'button',
                ariaAttributes: { 'aria-label': 'Test' },
                accessibleName: 'Test',
                accessibleDescription: '',
                role: 'button',
                states: [],
                hierarchy: []
            };

            // Act & Assert
            expect(() => engine.displaySnapshotInNewWindow(snapshot)).toThrow('Failed to write content to new window');
        });
    });

    describe('Snapshot Export Features', () => {
        test('should generate JSON export of ARIA snapshot', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'button',
                ariaAttributes: { 'aria-label': 'Export data' },
                accessibleName: 'Export data',
                accessibleDescription: '',
                role: 'button',
                states: [],
                hierarchy: []
            };

            // Act
            const jsonExport = engine.exportSnapshotAsJSON(snapshot);

            // Assert
            // First verify it's valid JSON
            expect(() => JSON.parse(jsonExport)).not.toThrow();

            // Then check content
            expect(jsonExport).toContain('"element": "button"');
            expect(jsonExport).toContain('"aria-label": "Export data"');
            expect(jsonExport).toContain('"accessibleName": "Export data"');
        });

        test('should generate CSV export of ARIA attributes', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'input',
                ariaAttributes: {
                    'aria-label': 'Username',
                    'aria-required': 'true',
                    'role': 'textbox'
                },
                accessibleName: 'Username',
                accessibleDescription: '',
                role: 'textbox',
                states: ['required'],
                hierarchy: []
            };

            // Act
            const csvExport = engine.exportSnapshotAsCSV(snapshot);

            // Assert
            expect(csvExport).toContain('Attribute,Value');
            expect(csvExport).toContain('aria-label,Username');
            expect(csvExport).toContain('aria-required,true');
            expect(csvExport).toContain('role,textbox');
        });

        test('should include export buttons in HTML display', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'button',
                ariaAttributes: { 'aria-label': 'Test' },
                accessibleName: 'Test',
                accessibleDescription: '',
                role: 'button',
                states: [],
                hierarchy: []
            };

            // Act
            const htmlContent = engine.generateSnapshotHTML(snapshot);

            // Assert
            expect(htmlContent).toContain('Export as JSON');
            expect(htmlContent).toContain('Export as CSV');
            expect(htmlContent).toContain('onclick');
        });

        test('should properly escape CSV special characters', () => {
            // Arrange
            const snapshot: AriaSnapshot = {
                element: 'input',
                ariaAttributes: {
                    'aria-label': 'Name, First and Last',
                    'aria-describedby': 'Contains "quotes" and commas',
                    'aria-placeholder': 'Line 1\nLine 2'
                },
                accessibleName: 'Name, First and Last',
                accessibleDescription: 'Contains "quotes" and commas',
                role: 'textbox',
                states: [],
                hierarchy: []
            };

            // Act
            const csvExport = engine.exportSnapshotAsCSV(snapshot);

            // Assert
            expect(csvExport).toContain('"Name, First and Last"'); // Comma escaped
            expect(csvExport).toContain('"Contains ""quotes"" and commas"'); // Quotes escaped
            expect(csvExport).toContain('"Line 1\nLine 2"'); // Newline escaped
        });
    });
});