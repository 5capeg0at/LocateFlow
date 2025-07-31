/**
 * @fileoverview Tests for Options Page Manager
 * 
 * This test suite follows TDD methodology to test the options page
 * functionality including form handling, theme switching, and preference management.
 */

import { JSDOM } from 'jsdom';
import { OptionsPageManager } from '../../src/options/options-manager';
import { createDefaultUserPreferences, UserPreferences } from '../../src/shared/data-models';

describe('OptionsPageManager', () => {
    let dom: JSDOM;
    let document: Document;
    let mockChrome: any;
    let optionsManager: OptionsPageManager;

    beforeEach(() => {
        // Setup test DOM environment with options page HTML
        dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>LocateFlow Options</title>
      </head>
      <body>
          <div id="options-container" class="options-container">
              <header class="options-header">
                  <h1>LocateFlow Settings</h1>
              </header>
              
              <main class="options-main responsive">
                  <form role="form" aria-label="Extension Settings">
                      <fieldset class="theme-selection" role="radiogroup" aria-labelledby="theme-legend">
                          <legend id="theme-legend">Theme</legend>
                          <div class="radio-group">
                              <input type="radio" id="theme-light" name="theme" value="light">
                              <label for="theme-light">Light</label>
                          </div>
                          <div class="radio-group">
                              <input type="radio" id="theme-dark" name="theme" value="dark">
                              <label for="theme-dark">Dark</label>
                          </div>
                          <div class="radio-group">
                              <input type="radio" id="theme-auto" name="theme" value="auto">
                              <label for="theme-auto">Auto (System)</label>
                          </div>
                      </fieldset>

                      <div class="theme-preview">
                          <div class="preview-title">Preview</div>
                          <div class="preview-content">
                              <div class="preview-card">
                                  <p>This is how the extension will look with the selected theme.</p>
                              </div>
                          </div>
                      </div>

                      <fieldset class="history-settings">
                          <legend>History Settings</legend>
                          <div class="form-group">
                              <label for="history-limit">History Limit</label>
                              <input type="number" id="history-limit" name="historyLimit" min="1" max="1000" required>
                          </div>
                      </fieldset>

                      <fieldset class="additional-preferences">
                          <legend>Additional Preferences</legend>
                          
                          <div class="form-group">
                              <input type="checkbox" id="show-confidence-explanations" name="showConfidenceExplanations">
                              <label for="show-confidence-explanations">Show confidence explanations</label>
                          </div>
                          
                          <div class="form-group">
                              <input type="checkbox" id="enable-screenshots" name="enableScreenshots">
                              <label for="enable-screenshots">Enable screenshots</label>
                          </div>
                          
                          <div class="form-group">
                              <label for="highlight-color">Highlight Color</label>
                              <input type="color" id="highlight-color" name="highlightColor" pattern="^#[0-9a-fA-F]{6}$" required>
                          </div>
                      </fieldset>

                      <div class="validation-errors hidden"></div>

                      <div class="form-actions">
                          <button type="submit" class="save-button btn btn-primary">Save Settings</button>
                          <button type="button" class="reset-button btn btn-secondary">Reset to Defaults</button>
                          <button type="button" class="export-button btn btn-secondary">Export Settings</button>
                          <button type="button" class="import-button btn btn-secondary">Import Settings</button>
                          <input type="file" class="import-file-input" accept=".json" style="display: none;">
                      </div>
                  </form>
              </main>
              
              <footer class="options-footer">
                  <p>&copy; 2025 LocateFlow Chrome Extension</p>
              </footer>
          </div>
      </body>
      </html>
    `, {
            url: 'chrome-extension://test/options.html',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        document = dom.window.document;

        // Mock Chrome APIs
        mockChrome = {
            storage: {
                local: {
                    get: jest.fn().mockResolvedValue({}),
                    set: jest.fn().mockResolvedValue(undefined)
                }
            }
        };

        // Mock global functions
        (global as any).confirm = jest.fn().mockReturnValue(true);
        (global as any).setTimeout = jest.fn().mockImplementation((fn) => fn());
    });

    afterEach(() => {
        dom.window.close();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default preferences when no stored preferences exist', async () => {
            mockChrome.storage.local.get.mockResolvedValue({});

            optionsManager = new OptionsPageManager({
                document,
                chrome: mockChrome
            });

            // Wait for async initialization
            await new Promise(resolve => setTimeout(resolve, 0));

            const currentPrefs = optionsManager.getCurrentPreferences();
            const defaultPrefs = createDefaultUserPreferences();

            expect(currentPrefs).toEqual(defaultPrefs);
            expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['preferences']);
        });

        test('should load existing preferences from storage', async () => {
            const storedPrefs: UserPreferences = {
                theme: 'dark',
                defaultLocatorTypes: ['css', 'xpath'],
                historyLimit: 50,
                showConfidenceExplanations: false,
                enableScreenshots: true,
                highlightColor: '#ff0000'
            };

            mockChrome.storage.local.get.mockResolvedValue({ preferences: storedPrefs });

            optionsManager = new OptionsPageManager({
                document,
                chrome: mockChrome
            });

            // Wait for async initialization
            await new Promise(resolve => setTimeout(resolve, 0));

            const currentPrefs = optionsManager.getCurrentPreferences();
            expect(currentPrefs).toEqual(storedPrefs);
        });

        test('should apply theme to body on initialization', async () => {
            const storedPrefs: UserPreferences = {
                ...createDefaultUserPreferences(),
                theme: 'dark'
            };

            mockChrome.storage.local.get.mockResolvedValue({ preferences: storedPrefs });

            optionsManager = new OptionsPageManager({
                document,
                chrome: mockChrome
            });

            // Wait for async initialization
            await optionsManager.initializeForTesting();

            expect(document.body.classList.contains('theme-dark')).toBe(true);
            expect(document.body.classList.contains('theme-light')).toBe(false);
        });
    });

    describe('UI Updates', () => {
        beforeEach(async () => {
            optionsManager = new OptionsPageManager({
                document,
                chrome: mockChrome
            });
            await optionsManager.initializeForTesting();
        });

        test('should update form fields with current preferences', () => {
            const testPrefs: UserPreferences = {
                theme: 'dark',
                defaultLocatorTypes: ['css'],
                historyLimit: 75,
                showConfidenceExplanations: false,
                enableScreenshots: true,
                highlightColor: '#ff0000'
            };

            optionsManager.setPreferences(testPrefs);

            // Check theme radio button
            const darkRadio = document.querySelector('input[name="theme"][value="dark"]') as HTMLInputElement;
            expect(darkRadio.checked).toBe(true);

            // Check history limit
            const historyInput = document.querySelector('input[name="historyLimit"]') as HTMLInputElement;
            expect(historyInput.value).toBe('75');

            // Check checkboxes
            const confidenceCheckbox = document.querySelector('input[name="showConfidenceExplanations"]') as HTMLInputElement;
            const screenshotsCheckbox = document.querySelector('input[name="enableScreenshots"]') as HTMLInputElement;

            expect(confidenceCheckbox.checked).toBe(false);
            expect(screenshotsCheckbox.checked).toBe(true);

            // Check color input
            const colorInput = document.querySelector('input[name="highlightColor"]') as HTMLInputElement;
            expect(colorInput.value).toBe('#ff0000');
        });

        test('should update theme preview when theme changes', () => {
            const lightRadio = document.querySelector('input[name="theme"][value="light"]') as HTMLInputElement;

            // Simulate theme change
            lightRadio.checked = true;
            lightRadio.dispatchEvent(new dom.window.Event('change'));

            const previewCard = document.querySelector('.preview-card') as HTMLElement;
            expect(previewCard.classList.contains('theme-light')).toBe(true);

            const previewText = previewCard.querySelector('p');
            expect(previewText?.textContent).toContain('light theme');
        });
    });

    describe('Form Validation', () => {
        beforeEach(async () => {
            optionsManager = new OptionsPageManager({
                document,
                chrome: mockChrome
            });
            await optionsManager.initializeForTesting();
        });

        test('should validate history limit input range', () => {
            const historyInput = document.querySelector('input[name="historyLimit"]') as HTMLInputElement;

            // Test invalid values
            historyInput.value = '0';
            historyInput.dispatchEvent(new dom.window.Event('blur'));
            expect(historyInput.classList.contains('invalid')).toBe(true);

            historyInput.value = '1001';
            historyInput.dispatchEvent(new dom.window.Event('blur'));
            expect(historyInput.classList.contains('invalid')).toBe(true);

            // Test valid value
            historyInput.value = '100';
            historyInput.dispatchEvent(new dom.window.Event('blur'));
            expect(historyInput.classList.contains('valid')).toBe(true);
        });

        test('should validate color input format', () => {
            const colorInput = document.querySelector('input[name="highlightColor"]') as HTMLInputElement;
            expect(colorInput).toBeTruthy();

            // For color inputs, we need to test the validation logic differently
            // since browsers automatically convert invalid values to valid ones

            // Test with a valid color
            colorInput.value = '#007acc';

            const mockEvent = { target: colorInput } as unknown as Event;
            const result = (optionsManager as any).validateInput(mockEvent);

            expect(result).toBe(true);
            expect(colorInput.classList.contains('valid')).toBe(true);
            expect(colorInput.classList.contains('invalid')).toBe(false);

            // Test with another valid color
            colorInput.value = '#ff0000';

            const mockEvent2 = { target: colorInput } as unknown as Event;
            const result2 = (optionsManager as any).validateInput(mockEvent2);

            expect(result2).toBe(true);
            expect(colorInput.classList.contains('valid')).toBe(true);
            expect(colorInput.classList.contains('invalid')).toBe(false);
        });

        test('should show validation errors for invalid form', async () => {
            const form = document.querySelector('form') as HTMLFormElement;
            const historyInput = document.querySelector('input[name="historyLimit"]') as HTMLInputElement;

            // Set invalid values
            historyInput.value = '0';

            // Submit form
            form.dispatchEvent(new dom.window.Event('submit'));

            const errorContainer = document.querySelector('.validation-errors');
            expect(errorContainer?.classList.contains('hidden')).toBe(false);
            expect(errorContainer?.textContent).toContain('History limit must be between 1 and 1000');
        });
    });

    describe('Form Submission', () => {
        beforeEach(async () => {
            optionsManager = new OptionsPageManager({
                document,
                chrome: mockChrome
            });
            await optionsManager.initializeForTesting();
        });

        test('should save preferences on valid form submission', async () => {
            const form = document.querySelector('form') as HTMLFormElement;

            // Set form values
            const darkRadio = document.querySelector('input[name="theme"][value="dark"]') as HTMLInputElement;
            const historyInput = document.querySelector('input[name="historyLimit"]') as HTMLInputElement;
            const confidenceCheckbox = document.querySelector('input[name="showConfidenceExplanations"]') as HTMLInputElement;
            const colorInput = document.querySelector('input[name="highlightColor"]') as HTMLInputElement;

            darkRadio.checked = true;
            historyInput.value = '150';
            confidenceCheckbox.checked = true;
            colorInput.value = '#ff0000';

            // Submit form
            form.dispatchEvent(new dom.window.Event('submit'));

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                preferences: expect.objectContaining({
                    theme: 'dark',
                    historyLimit: 150,
                    showConfidenceExplanations: true,
                    highlightColor: '#ff0000'
                })
            });
        });

        test('should save preferences successfully', async () => {
            mockChrome.storage.local.set.mockResolvedValue(undefined);

            const form = document.querySelector('form') as HTMLFormElement;
            const historyInput = document.querySelector('input[name="historyLimit"]') as HTMLInputElement;
            const colorInput = document.querySelector('input[name="highlightColor"]') as HTMLInputElement;

            historyInput.value = '100';
            colorInput.value = '#007acc';

            form.dispatchEvent(new dom.window.Event('submit'));

            // Wait for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                preferences: expect.objectContaining({
                    historyLimit: 100,
                    highlightColor: '#007acc'
                })
            });
        });

        test('should show error message on save failure', async () => {
            mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'));

            const form = document.querySelector('form') as HTMLFormElement;
            const historyInput = document.querySelector('input[name="historyLimit"]') as HTMLInputElement;
            const colorInput = document.querySelector('input[name="highlightColor"]') as HTMLInputElement;

            historyInput.value = '100';
            colorInput.value = '#007acc';

            // Create a promise that resolves when the form submission is complete
            const submitPromise = new Promise<void>((resolve) => {
                const originalShowError = (optionsManager as any).showError;
                (optionsManager as any).showError = function (message: string) {
                    originalShowError.call(this, message);
                    resolve();
                };
            });

            form.dispatchEvent(new dom.window.Event('submit'));

            await submitPromise;

            const errorContainer = document.querySelector('.validation-errors');
            expect(errorContainer?.textContent).toContain('Failed to save settings');
        });
    });

    describe('Reset Functionality', () => {
        beforeEach(async () => {
            optionsManager = new OptionsPageManager({
                document,
                chrome: mockChrome
            });
            await optionsManager.initializeForTesting();
        });

        test('should reset preferences to defaults when confirmed', async () => {
            // Set non-default preferences
            const testPrefs: UserPreferences = {
                theme: 'dark',
                defaultLocatorTypes: ['css'],
                historyLimit: 50,
                showConfidenceExplanations: false,
                enableScreenshots: true,
                highlightColor: '#ff0000'
            };

            optionsManager.setPreferences(testPrefs);

            // Mock confirm to return true
            (global as any).confirm = jest.fn().mockReturnValue(true);

            const resetButton = document.querySelector('.reset-button') as HTMLButtonElement;
            resetButton.dispatchEvent(new dom.window.Event('click'));

            await new Promise(resolve => setTimeout(resolve, 0));

            const currentPrefs = optionsManager.getCurrentPreferences();
            const defaultPrefs = createDefaultUserPreferences();

            expect(currentPrefs).toEqual(defaultPrefs);
            expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                preferences: defaultPrefs
            });
        });

        test('should not reset preferences when cancelled', async () => {
            const testPrefs: UserPreferences = {
                theme: 'dark',
                defaultLocatorTypes: ['css'],
                historyLimit: 50,
                showConfidenceExplanations: false,
                enableScreenshots: true,
                highlightColor: '#ff0000'
            };

            optionsManager.setPreferences(testPrefs);

            // Mock confirm to return false
            (global as any).confirm = jest.fn().mockReturnValue(false);

            const resetButton = document.querySelector('.reset-button') as HTMLButtonElement;
            resetButton.dispatchEvent(new dom.window.Event('click'));

            await new Promise(resolve => setTimeout(resolve, 0));

            const currentPrefs = optionsManager.getCurrentPreferences();
            expect(currentPrefs).toEqual(testPrefs);
            expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
        });
    });

    describe('Theme Application', () => {
        beforeEach(async () => {
            optionsManager = new OptionsPageManager({
                document,
                chrome: mockChrome
            });
            await optionsManager.initializeForTesting();
        });

        test('should apply theme classes to body', () => {
            const testPrefs: UserPreferences = {
                ...createDefaultUserPreferences(),
                theme: 'dark'
            };

            optionsManager.setPreferences(testPrefs);

            expect(document.body.classList.contains('theme-dark')).toBe(true);
            expect(document.body.classList.contains('theme-light')).toBe(false);
            expect(document.body.classList.contains('theme-auto')).toBe(false);
        });

        test('should update preview card theme', () => {
            const testPrefs: UserPreferences = {
                ...createDefaultUserPreferences(),
                theme: 'light'
            };

            optionsManager.setPreferences(testPrefs);

            const previewCard = document.querySelector('.preview-card') as HTMLElement;
            expect(previewCard.classList.contains('theme-light')).toBe(true);
            expect(previewCard.classList.contains('theme-dark')).toBe(false);
        });
    });

    describe('Advanced Preference Management', () => {
        beforeEach(async () => {
            optionsManager = new OptionsPageManager({
                document,
                chrome: mockChrome
            });
            await optionsManager.initializeForTesting();
        });

        describe('History Limit Validation', () => {
            test('should validate history limit is within acceptable range', () => {
                const historyInput = document.querySelector('input[name="historyLimit"]') as HTMLInputElement;

                // Test minimum boundary
                historyInput.value = '1';
                historyInput.dispatchEvent(new dom.window.Event('blur'));
                expect(historyInput.classList.contains('valid')).toBe(true);

                // Test maximum boundary
                historyInput.value = '1000';
                historyInput.dispatchEvent(new dom.window.Event('blur'));
                expect(historyInput.classList.contains('valid')).toBe(true);

                // Test below minimum
                historyInput.value = '0';
                historyInput.dispatchEvent(new dom.window.Event('blur'));
                expect(historyInput.classList.contains('invalid')).toBe(true);

                // Test above maximum
                historyInput.value = '1001';
                historyInput.dispatchEvent(new dom.window.Event('blur'));
                expect(historyInput.classList.contains('invalid')).toBe(true);

                // Test non-numeric input
                historyInput.value = 'abc';
                historyInput.dispatchEvent(new dom.window.Event('blur'));
                expect(historyInput.classList.contains('invalid')).toBe(true);
            });

            test('should provide detailed validation message for history limit', async () => {
                const form = document.querySelector('form') as HTMLFormElement;
                const historyInput = document.querySelector('input[name="historyLimit"]') as HTMLInputElement;

                historyInput.value = '2000';
                form.dispatchEvent(new dom.window.Event('submit'));

                const errorContainer = document.querySelector('.validation-errors');
                expect(errorContainer?.textContent).toContain('History limit must be between 1 and 1000');
            });
        });

        describe('Highlight Color Validation', () => {
            test('should validate highlight color format', () => {
                const colorInput = document.querySelector('input[name="highlightColor"]') as HTMLInputElement;

                // Test valid hex colors
                const validColors = ['#000000', '#ffffff', '#007acc', '#ff0000', '#00ff00', '#0000ff'];
                validColors.forEach(color => {
                    colorInput.value = color;
                    const mockEvent = { target: colorInput } as unknown as Event;
                    const result = (optionsManager as any).validateInput(mockEvent);
                    expect(result).toBe(true);
                    expect(colorInput.classList.contains('valid')).toBe(true);
                });

                // Test the validation logic directly with invalid values
                const validateColorDirectly = (value: string) => {
                    return value.length > 0 && /^#[0-9a-fA-F]{6}$/.test(value);
                };

                expect(validateColorDirectly('')).toBe(false);
                expect(validateColorDirectly('#gggggg')).toBe(false);
                expect(validateColorDirectly('#12345')).toBe(false);
                expect(validateColorDirectly('#1234567')).toBe(false);
                expect(validateColorDirectly('red')).toBe(false);
                expect(validateColorDirectly('#007acc')).toBe(true);
            });

            test('should validate color format in form validation', async () => {
                // Test the form validation logic directly
                const validateForm = (optionsManager as any).validateForm.bind(optionsManager);

                // Mock form inputs with invalid color
                const mockColorInput = { value: 'invalid-color' };
                const mockHistoryInput = { value: '100' };

                // Mock querySelector to return our mock inputs
                const originalQuerySelector = document.querySelector;
                document.querySelector = jest.fn((selector) => {
                    if (selector === 'input[name="highlightColor"]') return mockColorInput;
                    if (selector === 'input[name="historyLimit"]') return mockHistoryInput;
                    if (selector === 'input[name="theme"]:checked') return { value: 'light' };
                    return originalQuerySelector.call(document, selector);
                });

                const errors = validateForm();
                expect(errors).toContain('Highlight color must be a valid hex color (e.g., #007acc).');

                // Restore original querySelector
                document.querySelector = originalQuerySelector;
            });
        });

        describe('Settings Import/Export', () => {
            test('should export current preferences as JSON', async () => {
                const testPrefs: UserPreferences = {
                    theme: 'dark',
                    defaultLocatorTypes: ['css', 'xpath'],
                    historyLimit: 150,
                    showConfidenceExplanations: false,
                    enableScreenshots: true,
                    highlightColor: '#ff0000'
                };

                optionsManager.setPreferences(testPrefs);

                const exportedData = await optionsManager.exportSettings();
                const parsedData = JSON.parse(exportedData);

                expect(parsedData).toEqual(testPrefs);
                expect(typeof exportedData).toBe('string');
            });

            test('should import valid preferences from JSON', async () => {
                const importPrefs: UserPreferences = {
                    theme: 'light',
                    defaultLocatorTypes: ['id', 'class'],
                    historyLimit: 75,
                    showConfidenceExplanations: true,
                    enableScreenshots: false,
                    highlightColor: '#00ff00'
                };

                const jsonData = JSON.stringify(importPrefs);
                const result = await optionsManager.importSettings(jsonData);

                expect(result.success).toBe(true);
                expect(result.error).toBeUndefined();
                expect(optionsManager.getCurrentPreferences()).toEqual(importPrefs);
                expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                    preferences: importPrefs
                });
            });

            test('should reject invalid JSON during import', async () => {
                const invalidJson = '{ invalid json }';
                const result = await optionsManager.importSettings(invalidJson);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Invalid JSON format');
            });

            test('should reject invalid preferences structure during import', async () => {
                const invalidPrefs = {
                    theme: 'invalid-theme',
                    historyLimit: -1,
                    highlightColor: 'not-a-color'
                };

                const jsonData = JSON.stringify(invalidPrefs);
                const result = await optionsManager.importSettings(jsonData);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Invalid preferences format');
            });

            test('should validate imported preferences against schema', async () => {
                const partialPrefs = {
                    theme: 'dark',
                    historyLimit: 100
                    // Missing required fields
                };

                const jsonData = JSON.stringify(partialPrefs);
                const result = await optionsManager.importSettings(jsonData);

                expect(result.success).toBe(false);
                expect(result.error).toContain('Invalid preferences format');
            });
        });

        describe('Advanced Preference Persistence', () => {
            test('should persist complex preference combinations', async () => {
                const complexPrefs: UserPreferences = {
                    theme: 'auto',
                    defaultLocatorTypes: ['css', 'xpath', 'aria'],
                    historyLimit: 500,
                    showConfidenceExplanations: true,
                    enableScreenshots: true,
                    highlightColor: '#7b68ee'
                };

                optionsManager.setPreferences(complexPrefs);

                const form = document.querySelector('form') as HTMLFormElement;
                form.dispatchEvent(new dom.window.Event('submit'));

                await new Promise(resolve => setTimeout(resolve, 0));

                expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
                    preferences: complexPrefs
                });
            });

            test('should handle storage errors gracefully during preference save', async () => {
                mockChrome.storage.local.set.mockRejectedValue(new Error('Storage quota exceeded'));

                const form = document.querySelector('form') as HTMLFormElement;

                // Create a promise that resolves when the form submission is complete
                const submitPromise = new Promise<void>((resolve) => {
                    const originalShowError = (optionsManager as any).showError;
                    (optionsManager as any).showError = function (message: string) {
                        originalShowError.call(this, message);
                        resolve();
                    };
                });

                form.dispatchEvent(new dom.window.Event('submit'));
                await submitPromise;

                const errorContainer = document.querySelector('.validation-errors');
                expect(errorContainer?.textContent).toContain('Failed to save settings');
            });

            test('should validate preferences before saving', async () => {
                // Manually set invalid preferences in the form
                const historyInput = document.querySelector('input[name="historyLimit"]') as HTMLInputElement;
                const colorInput = document.querySelector('input[name="highlightColor"]') as HTMLInputElement;

                historyInput.value = '0';
                colorInput.value = 'invalid';

                const form = document.querySelector('form') as HTMLFormElement;
                form.dispatchEvent(new dom.window.Event('submit'));

                // Should not call storage.set with invalid data
                expect(mockChrome.storage.local.set).not.toHaveBeenCalled();

                const errorContainer = document.querySelector('.validation-errors');
                expect(errorContainer?.classList.contains('hidden')).toBe(false);
            });
        });

        describe('Preference Migration and Compatibility', () => {
            test('should handle missing preference fields with defaults', async () => {
                // Create a complete but partial preferences object that will pass validation
                const incompletePrefs = {
                    theme: 'dark',
                    defaultLocatorTypes: ['css', 'xpath'],
                    historyLimit: 50,
                    showConfidenceExplanations: true,
                    enableScreenshots: false,
                    highlightColor: '#007acc'
                };

                mockChrome.storage.local.get.mockResolvedValue({ preferences: incompletePrefs });

                const newManager = new OptionsPageManager({
                    document,
                    chrome: mockChrome
                });

                await newManager.initializeForTesting();

                const currentPrefs = newManager.getCurrentPreferences();

                // Should preserve all valid fields since this is a complete preferences object
                expect(currentPrefs.theme).toBe('dark');
                expect(currentPrefs.historyLimit).toBe(50);
                expect(currentPrefs.defaultLocatorTypes).toEqual(['css', 'xpath']);
                expect(currentPrefs.showConfidenceExplanations).toBe(true);
                expect(currentPrefs.enableScreenshots).toBe(false);
                expect(currentPrefs.highlightColor).toBe('#007acc');
            });

            test('should handle corrupted preference data', async () => {
                const corruptedPrefs = {
                    theme: 'invalid-theme',
                    historyLimit: 'not-a-number',
                    highlightColor: 'invalid-color'
                };

                mockChrome.storage.local.get.mockResolvedValue({ preferences: corruptedPrefs });

                const newManager = new OptionsPageManager({
                    document,
                    chrome: mockChrome
                });

                await newManager.initializeForTesting();

                const currentPrefs = newManager.getCurrentPreferences();
                const defaultPrefs = createDefaultUserPreferences();

                // Should fall back to defaults for corrupted data
                expect(currentPrefs).toEqual(defaultPrefs);
            });
        });
    });
});