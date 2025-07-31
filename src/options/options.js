/**
 * @fileoverview Options Page JavaScript
 * 
 * Handles form interactions, theme switching, and preference management
 * for the LocateFlow Chrome Extension options page.
 * 
 * Requirements covered:
 * - 6.1: Theme toggle option for dark mode
 * - 6.2: Dark theme application to all UI components
 * - 6.3: Theme preference persistence across browser sessions
 */

import { createDefaultUserPreferences, validateUserPreferences } from '../shared/data-models.js';

/**
 * Options Page Manager
 * 
 * Manages the options page functionality including form handling,
 * theme switching, and preference persistence.
 */
class OptionsPageManager {
    constructor(dependencies = {}) {
        this.document = dependencies.document || document;
        this.chrome = dependencies.chrome || chrome;

        this.form = null;
        this.themeRadios = null;
        this.previewContent = null;
        this.validationErrors = null;

        this.currentPreferences = createDefaultUserPreferences();

        this.init();
    }

    /**
     * Initialize the options page
     */
    async init() {
        try {
            this.setupDOMReferences();
            this.setupEventListeners();
            await this.loadPreferences();
            this.updateUI();
            this.applyTheme(this.currentPreferences.theme);
        } catch (error) {
            console.error('Failed to initialize options page:', error);
            this.showError('Failed to initialize options page. Please refresh and try again.');
        }
    }

    /**
     * Setup DOM element references
     */
    setupDOMReferences() {
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
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));

        // Reset button
        const resetButton = this.document.querySelector('.reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', this.handleReset.bind(this));
        }

        // Theme change listeners
        this.themeRadios.forEach(radio => {
            radio.addEventListener('change', this.handleThemeChange.bind(this));
        });

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
    async loadPreferences() {
        try {
            const result = await this.chrome.storage.local.get(['preferences']);
            if (result.preferences && validateUserPreferences(result.preferences)) {
                this.currentPreferences = result.preferences;
            } else {
                this.currentPreferences = createDefaultUserPreferences();
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
            this.currentPreferences = createDefaultUserPreferences();
        }
    }

    /**
     * Save preferences to Chrome storage
     */
    async savePreferences() {
        try {
            await this.chrome.storage.local.set({ preferences: this.currentPreferences });
            return true;
        } catch (error) {
            console.error('Failed to save preferences:', error);
            return false;
        }
    }

    /**
     * Update UI with current preferences
     */
    updateUI() {
        // Set theme radio button
        const themeRadio = this.document.querySelector(`input[name="theme"][value="${this.currentPreferences.theme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }

        // Set history limit
        const historyLimitInput = this.document.querySelector('input[name="historyLimit"]');
        if (historyLimitInput) {
            historyLimitInput.value = this.currentPreferences.historyLimit.toString();
        }

        // Set confidence explanations checkbox
        const confidenceCheckbox = this.document.querySelector('input[name="showConfidenceExplanations"]');
        if (confidenceCheckbox) {
            confidenceCheckbox.checked = this.currentPreferences.showConfidenceExplanations;
        }

        // Set screenshots checkbox
        const screenshotsCheckbox = this.document.querySelector('input[name="enableScreenshots"]');
        if (screenshotsCheckbox) {
            screenshotsCheckbox.checked = this.currentPreferences.enableScreenshots;
        }

        // Set highlight color
        const colorInput = this.document.querySelector('input[name="highlightColor"]');
        if (colorInput) {
            colorInput.value = this.currentPreferences.highlightColor;
        }
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(event) {
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
            console.error('Error saving preferences:', error);
            this.showError('An error occurred while saving settings.');
        }
    }

    /**
     * Handle reset button click
     */
    async handleReset() {
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
     * Handle theme change
     */
    handleThemeChange(event) {
        const selectedTheme = event.target.value;
        this.applyTheme(selectedTheme);
        this.updatePreviewTheme(selectedTheme);
    }

    /**
     * Handle input change for real-time validation
     */
    handleInputChange(event) {
        this.validateInput(event);
    }

    /**
     * Apply theme to the page
     */
    applyTheme(theme) {
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
    updatePreviewTheme(theme) {
        if (!this.previewContent) return;

        const previewCard = this.previewContent.querySelector('.preview-card');
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
    updatePreferencesFromForm() {
        const formData = new FormData(this.form);

        // Theme
        const theme = formData.get('theme');
        if (theme && ['light', 'dark', 'auto'].includes(theme)) {
            this.currentPreferences.theme = theme;
        }

        // History limit
        const historyLimit = parseInt(formData.get('historyLimit'));
        if (!isNaN(historyLimit) && historyLimit >= 1 && historyLimit <= 1000) {
            this.currentPreferences.historyLimit = historyLimit;
        }

        // Confidence explanations
        this.currentPreferences.showConfidenceExplanations = formData.has('showConfidenceExplanations');

        // Screenshots
        this.currentPreferences.enableScreenshots = formData.has('enableScreenshots');

        // Highlight color
        const highlightColor = formData.get('highlightColor');
        if (highlightColor && /^#[0-9a-fA-F]{6}$/.test(highlightColor)) {
            this.currentPreferences.highlightColor = highlightColor;
        }
    }

    /**
     * Validate the entire form
     */
    validateForm() {
        const errors = [];

        // Validate history limit
        const historyLimitInput = this.document.querySelector('input[name="historyLimit"]');
        if (historyLimitInput) {
            const value = parseInt(historyLimitInput.value);
            if (isNaN(value) || value < 1 || value > 1000) {
                errors.push('History limit must be between 1 and 1000.');
            }
        }

        // Validate highlight color
        const colorInput = this.document.querySelector('input[name="highlightColor"]');
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
    validateInput(event) {
        const input = event.target;
        const value = input.value;

        // Remove existing validation classes
        input.classList.remove('invalid', 'valid');

        let isValid = true;

        switch (input.name) {
            case 'historyLimit':
                const numValue = parseInt(value);
                isValid = !isNaN(numValue) && numValue >= 1 && numValue <= 1000;
                break;

            case 'highlightColor':
                isValid = /^#[0-9a-fA-F]{6}$/.test(value);
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
    showErrors(errors) {
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

        // Scroll to errors
        this.validationErrors.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Show single error message
     */
    showError(message) {
        this.showErrors([message]);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
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
    hideErrors() {
        if (!this.validationErrors) return;

        this.validationErrors.classList.add('hidden');
        this.validationErrors.style.backgroundColor = '';
        this.validationErrors.innerHTML = '';
    }
}

// Initialize options page when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        new OptionsPageManager();
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OptionsPageManager };
}