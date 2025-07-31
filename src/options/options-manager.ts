/**
 * @fileoverview Options Page Manager TypeScript Implementation
 * 
 * Handles form interactions, theme switching, and preference management
 * for the LocateFlow Chrome Extension options page with full type safety.
 * 
 * Requirements covered:
 * - 6.1: Theme toggle option for dark mode
 * - 6.2: Dark theme application to all UI components
 * - 6.3: Theme preference persistence across browser sessions
 */

import {
  UserPreferences,
  Theme,
  createDefaultUserPreferences,
  validateUserPreferences
} from '../shared/data-models';

// Global type reference for DOM types
/// <reference lib="dom" />

/**
 * Dependencies interface for dependency injection
 */
export interface OptionsPageDependencies {
  document?: Document;
  chrome?: typeof chrome;
}

/**
 * Options Page Manager
 * 
 * Manages the options page functionality including form handling,
 * theme switching, and preference persistence.
 */
export class OptionsPageManager {
  private document: Document;
  private chrome: typeof chrome;

  private form: HTMLFormElement | null = null;
  // eslint-disable-next-line no-undef
  private themeRadios: NodeListOf<HTMLInputElement> | null = null;
  private previewContent: HTMLElement | null = null;
  private validationErrors: HTMLElement | null = null;

  private currentPreferences: UserPreferences;

  constructor(dependencies: OptionsPageDependencies = {}) {
    this.document = dependencies.document || document;
    this.chrome = dependencies.chrome || chrome;

    this.currentPreferences = createDefaultUserPreferences();

    // Initialize asynchronously but don't wait for it in constructor
    this.init().catch(error => {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize options page:', error);
    });
  }

  /**
     * Initialize the options page
     */
  private async init(): Promise<void> {
    try {
      this.setupDOMReferences();
      this.setupEventListeners();
      await this.loadPreferences();
      this.updateUI();
      this.applyTheme(this.currentPreferences.theme);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize options page:', error);
      this.showError('Failed to initialize options page. Please refresh and try again.');
    }
  }

  /**
     * Setup DOM element references
     */
  private setupDOMReferences(): void {
    this.form = this.document.querySelector('form');
    this.themeRadios = this.document.querySelectorAll('input[name="theme"]');
    this.previewContent = this.document.querySelector('.preview-content');
    this.validationErrors = this.document.querySelector('.validation-errors');

    if (!this.form) {
      throw new Error('Form element not found');
    }
  }

  /**
     * Setup event listeners
     */
  private setupEventListeners(): void {
    if (!this.form) return;

    // Form submission
    this.form.addEventListener('submit', this.handleFormSubmit.bind(this));

    // Reset button
    const resetButton = this.document.querySelector('.reset-button') as HTMLButtonElement;
    if (resetButton) {
      resetButton.addEventListener('click', this.handleReset.bind(this));
    }

    // Export button
    const exportButton = this.document.querySelector('.export-button') as HTMLButtonElement;
    if (exportButton) {
      exportButton.addEventListener('click', this.handleExport.bind(this));
    }

    // Import button
    const importButton = this.document.querySelector('.import-button') as HTMLButtonElement;
    if (importButton) {
      importButton.addEventListener('click', this.handleImport.bind(this));
    }

    // Import file input
    const importFileInput = this.document.querySelector('.import-file-input') as HTMLInputElement;
    if (importFileInput) {
      importFileInput.addEventListener('change', this.handleImportFile.bind(this));
    }

    // Theme change listeners
    if (this.themeRadios) {
      this.themeRadios.forEach(radio => {
        radio.addEventListener('change', this.handleThemeChange.bind(this));
      });
    }

    // Real-time validation
    const inputs = this.form.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', this.handleInputChange.bind(this));
      input.addEventListener('blur', this.validateInput.bind(this));
    });
  }

  /**
     * Load preferences from Chrome storage
     */
  private async loadPreferences(): Promise<void> {
    try {
      const result = await this.chrome.storage.local.get(['preferences']);
      if (result.preferences && validateUserPreferences(result.preferences)) {
        this.currentPreferences = result.preferences;
      } else {
        this.currentPreferences = createDefaultUserPreferences();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load preferences:', error);
      this.currentPreferences = createDefaultUserPreferences();
    }
  }

  /**
     * Save preferences to Chrome storage
     */
  private async savePreferences(): Promise<boolean> {
    try {
      await this.chrome.storage.local.set({ preferences: this.currentPreferences });
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to save preferences:', error);
      return false;
    }
  }

  /**
     * Update UI with current preferences
     */
  private updateUI(): void {
    // Set theme radio button
    const themeRadio = this.document.querySelector(
      `input[name="theme"][value="${this.currentPreferences.theme}"]`
    ) as HTMLInputElement;
    if (themeRadio) {
      themeRadio.checked = true;
    }

    // Set history limit
    const historyLimitInput = this.document.querySelector(
      'input[name="historyLimit"]'
    ) as HTMLInputElement;
    if (historyLimitInput) {
      historyLimitInput.value = this.currentPreferences.historyLimit.toString();
    }

    // Set confidence explanations checkbox
    const confidenceCheckbox = this.document.querySelector(
      'input[name="showConfidenceExplanations"]'
    ) as HTMLInputElement;
    if (confidenceCheckbox) {
      confidenceCheckbox.checked = this.currentPreferences.showConfidenceExplanations;
    }

    // Set screenshots checkbox
    const screenshotsCheckbox = this.document.querySelector(
      'input[name="enableScreenshots"]'
    ) as HTMLInputElement;
    if (screenshotsCheckbox) {
      screenshotsCheckbox.checked = this.currentPreferences.enableScreenshots;
    }

    // Set highlight color
    const colorInput = this.document.querySelector(
      'input[name="highlightColor"]'
    ) as HTMLInputElement;
    if (colorInput) {
      colorInput.value = this.currentPreferences.highlightColor;
    }
  }

  /**
     * Handle form submission
     */
  private async handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();

    try {
      this.hideErrors();

      // Validate form
      const validationErrors = this.validateForm();
      if (validationErrors.length > 0) {
        this.showErrors(validationErrors);
        return;
      }

      // Update preferences from form
      this.updatePreferencesFromForm();

      // Save preferences
      const saved = await this.savePreferences();
      if (saved) {
        this.showSuccess('Settings saved successfully!');
        this.applyTheme(this.currentPreferences.theme);
      } else {
        this.showError('Failed to save settings. Please try again.');
      }
    } catch (error) {

      this.showError('An error occurred while saving settings.');
    }
  }

  /**
     * Handle reset button click
     */
  private async handleReset(): Promise<void> {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.currentPreferences = createDefaultUserPreferences();
      this.updateUI();
      this.applyTheme(this.currentPreferences.theme);

      const saved = await this.savePreferences();
      if (saved) {
        this.showSuccess('Settings reset to defaults successfully!');
      } else {
        this.showError('Failed to reset settings. Please try again.');
      }
    }
  }

  /**
     * Handle export button click
     */
  private async handleExport(): Promise<void> {
    try {
      const exportData = await this.exportSettings();

      // Create download link
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = this.document.createElement('a');
      link.href = url;
      link.download = `locateflow-settings-${new Date().toISOString().split('T')[0]}.json`;

      // Trigger download
      this.document.body.appendChild(link);
      link.click();
      this.document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      this.showSuccess('Settings exported successfully!');
    } catch (error) {
      this.showError('Failed to export settings. Please try again.');
    }
  }

  /**
     * Handle import button click
     */
  private handleImport(): void {
    const importFileInput = this.document.querySelector('.import-file-input') as HTMLInputElement;
    if (importFileInput) {
      importFileInput.click();
    }
  }

  /**
     * Handle import file selection
     */
  private async handleImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      const fileContent = await this.readFileAsText(file);
      const result = await this.importSettings(fileContent);

      if (result.success) {
        this.showSuccess('Settings imported successfully!');
      } else {
        this.showError(result.error || 'Failed to import settings.');
      }
    } catch (error) {
      this.showError('Failed to read import file. Please try again.');
    } finally {
      // Clear the input so the same file can be selected again
      input.value = '';
    }
  }

  /**
     * Read file as text
     */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
     * Handle theme change
     */
  private handleThemeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const selectedTheme = target.value as Theme;
    this.applyTheme(selectedTheme);
    this.updatePreviewTheme(selectedTheme);
  }

  /**
     * Handle input change for real-time validation
     */
  private handleInputChange(event: Event): void {
    this.validateInput(event);
  }

  /**
     * Apply theme to the page
     */
  private applyTheme(theme: Theme): void {
    const body = this.document.body;

    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

    // Add new theme class
    body.classList.add(`theme-${theme}`);

    // Update preview
    this.updatePreviewTheme(theme);
  }

  /**
     * Update theme preview
     */
  private updatePreviewTheme(theme: Theme): void {
    if (!this.previewContent) return;

    const previewCard = this.previewContent.querySelector('.preview-card') as HTMLElement;
    if (previewCard) {
      // Remove existing theme classes from preview
      previewCard.classList.remove('theme-light', 'theme-dark', 'theme-auto');

      // Add new theme class to preview
      previewCard.classList.add(`theme-${theme}`);

      // Update preview text
      const previewText = previewCard.querySelector('p');
      if (previewText) {
        previewText.textContent = `This is how the extension will look with the ${theme} theme.`;
      }
    }
  }

  /**
     * Update preferences object from form values
     */
  private updatePreferencesFromForm(): void {
    if (!this.form) return;

    // Theme
    const themeRadio = this.document.querySelector('input[name="theme"]:checked') as HTMLInputElement;
    if (themeRadio && ['light', 'dark', 'auto'].includes(themeRadio.value)) {
      this.currentPreferences.theme = themeRadio.value as Theme;
    }

    // History limit
    const historyLimitInput = this.document.querySelector('input[name="historyLimit"]') as HTMLInputElement;
    if (historyLimitInput) {
      const historyLimit = parseInt(historyLimitInput.value);
      if (!isNaN(historyLimit) && historyLimit >= 1 && historyLimit <= 1000) {
        this.currentPreferences.historyLimit = historyLimit;
      }
    }

    // Confidence explanations
    const confidenceCheckbox = this.document.querySelector('input[name="showConfidenceExplanations"]') as HTMLInputElement;
    if (confidenceCheckbox) {
      this.currentPreferences.showConfidenceExplanations = confidenceCheckbox.checked;
    }

    // Screenshots
    const screenshotsCheckbox = this.document.querySelector('input[name="enableScreenshots"]') as HTMLInputElement;
    if (screenshotsCheckbox) {
      this.currentPreferences.enableScreenshots = screenshotsCheckbox.checked;
    }

    // Highlight color
    const colorInput = this.document.querySelector('input[name="highlightColor"]') as HTMLInputElement;
    if (colorInput && /^#[0-9a-fA-F]{6}$/.test(colorInput.value)) {
      this.currentPreferences.highlightColor = colorInput.value;
    }
  }

  /**
     * Validate the entire form
     */
  private validateForm(): string[] {
    const errors: string[] = [];

    // Validate history limit
    const historyLimitInput = this.document.querySelector(
      'input[name="historyLimit"]'
    ) as HTMLInputElement;
    if (historyLimitInput) {
      const value = parseInt(historyLimitInput.value);
      if (isNaN(value) || value < 1 || value > 1000) {
        errors.push('History limit must be between 1 and 1000.');
      }
    }

    // Validate highlight color
    const colorInput = this.document.querySelector(
      'input[name="highlightColor"]'
    ) as HTMLInputElement;
    if (colorInput) {
      const value = colorInput.value;
      if (!value || !/^#[0-9a-fA-F]{6}$/.test(value)) {
        errors.push('Highlight color must be a valid hex color (e.g., #007acc).');
      }
    }

    // Validate theme selection
    const selectedTheme = this.document.querySelector('input[name="theme"]:checked');
    if (!selectedTheme) {
      errors.push('Please select a theme.');
    }

    return errors;
  }

  /**
     * Validate individual input
     */
  private validateInput(event: Event): boolean {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Remove existing validation classes
    input.classList.remove('invalid', 'valid');

    let isValid = true;

    switch (input.name) {
      case 'historyLimit': {
        const numValue = parseInt(value);
        isValid = !isNaN(numValue) && numValue >= 1 && numValue <= 1000;
        break;
      }

      case 'highlightColor':
        isValid = value.length > 0 && /^#[0-9a-fA-F]{6}$/.test(value);
        break;

      default:
        isValid = input.checkValidity();
    }

    // Add validation class
    input.classList.add(isValid ? 'valid' : 'invalid');

    return isValid;
  }

  /**
     * Show validation errors
     */
  private showErrors(errors: string[]): void {
    if (!this.validationErrors) return;

    this.validationErrors.innerHTML = '';
    this.validationErrors.classList.remove('hidden');

    const ul = this.document.createElement('ul');
    errors.forEach(error => {
      const li = this.document.createElement('li');
      li.textContent = error;
      ul.appendChild(li);
    });

    this.validationErrors.appendChild(ul);

    // Scroll to errors (if scrollIntoView is available)
    if (typeof this.validationErrors.scrollIntoView === 'function') {
      this.validationErrors.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
     * Show single error message
     */
  private showError(message: string): void {
    this.showErrors([message]);
  }

  /**
     * Show success message
     */
  private showSuccess(message: string): void {
    if (!this.validationErrors) return;

    this.validationErrors.innerHTML = message;
    this.validationErrors.classList.remove('hidden');
    this.validationErrors.style.backgroundColor = 'var(--success-color)';

    // Hide success message after 3 seconds
    setTimeout(() => {
      this.hideErrors();
    }, 3000);
  }

  /**
     * Hide error/success messages
     */
  private hideErrors(): void {
    if (!this.validationErrors) return;

    this.validationErrors.classList.add('hidden');
    this.validationErrors.style.backgroundColor = '';
    this.validationErrors.innerHTML = '';
  }

  /**
     * Get current preferences (for testing)
     */
  public getCurrentPreferences(): UserPreferences {
    return { ...this.currentPreferences };
  }

  /**
     * Set preferences (for testing)
     */
  public setPreferences(preferences: UserPreferences): void {
    this.currentPreferences = { ...preferences };
    this.updateUI();
    this.applyTheme(this.currentPreferences.theme);
  }

  /**
     * Initialize for testing (synchronous)
     */
  public async initializeForTesting(): Promise<void> {
    await this.init();
  }

  /**
     * Export current settings as JSON string
     */
  public async exportSettings(): Promise<string> {
    try {
      return JSON.stringify(this.currentPreferences, null, 2);
    } catch (error) {
      throw new Error('Failed to export settings');
    }
  }

  /**
     * Import settings from JSON string
     */
  public async importSettings(jsonData: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Parse JSON
      let parsedData: any;
      try {
        parsedData = JSON.parse(jsonData);
      } catch (parseError) {
        return {
          success: false,
          error: 'Invalid JSON format'
        };
      }

      // Validate preferences structure
      if (!validateUserPreferences(parsedData)) {
        return {
          success: false,
          error: 'Invalid preferences format'
        };
      }

      // Update current preferences
      this.currentPreferences = parsedData;
      this.updateUI();
      this.applyTheme(this.currentPreferences.theme);

      // Save to storage
      const saved = await this.savePreferences();
      if (!saved) {
        return {
          success: false,
          error: 'Failed to save imported settings'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to import settings'
      };
    }
  }
}