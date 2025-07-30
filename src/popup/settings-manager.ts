/**
 * Settings Manager for LocateFlow Chrome Extension
 * Handles theme preferences, settings navigation, and auto theme detection
 */

import { UserPreferences, createDefaultUserPreferences } from '../shared/data-models';
import { logger } from '../shared/logger';

export interface SettingsManagerDependencies {
  document?: Document;
  window?: Window;
  chrome?: typeof chrome;
}

export class SettingsManager {
  private currentTheme: 'light' | 'dark' | 'auto' = 'light';
  private preferences: UserPreferences;
  private document: Document;
  private window: Window;
  private chrome: typeof chrome;

  // Getter for testing
  public getCurrentTheme(): 'light' | 'dark' | 'auto' {
    return this.currentTheme;
  }

  constructor(dependencies: SettingsManagerDependencies = {}) {
    this.preferences = createDefaultUserPreferences();

    // Use injected dependencies or fall back to globals
    this.document = dependencies.document || (typeof document !== 'undefined' ? document : (global as any).document);
    this.window = dependencies.window || (typeof window !== 'undefined' ? window : (global as any).window);
    this.chrome = dependencies.chrome || (typeof chrome !== 'undefined' ? chrome : (global as any).chrome);

    this.initializeEventListeners();
  }

  /**
   * Initialize theme based on stored preferences
   */
  async initializeTheme(): Promise<void> {
    try {
      const preferences = await this.loadPreferences();
      this.preferences = preferences;

      if (preferences.theme === 'auto') {
        const systemTheme = this.detectSystemTheme();
        this.applyTheme(systemTheme);
      } else {
        this.applyTheme(preferences.theme);
      }

      this.updateThemeUI();
    } catch (error) {
      logger.warn('Failed to initialize theme:', error);
      this.applyTheme('light');
    }
  }

  /**
   * Load user preferences from Chrome storage
   */
  async loadPreferences(): Promise<UserPreferences> {
    try {
      const result = await this.chrome.storage.local.get(['preferences']);
      if (result.preferences) {
        return { ...createDefaultUserPreferences(), ...result.preferences };
      }
      return createDefaultUserPreferences();
    } catch (error) {
      logger.warn('Failed to load preferences:', error);
      return createDefaultUserPreferences();
    }
  }

  /**
   * Save theme preference to Chrome storage
   */
  async saveThemePreference(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    try {
      this.preferences.theme = theme;
      await this.chrome.storage.local.set({
        preferences: this.preferences
      });
    } catch (error) {
      logger.warn('Failed to save theme preference:', error);
    }
  }

  /**
   * Detect system theme preference
   */
  detectSystemTheme(): 'light' | 'dark' {
    try {
      if (this.window && this.window.matchMedia) {
        const darkModeQuery = this.window.matchMedia('(prefers-color-scheme: dark)');
        return darkModeQuery.matches ? 'dark' : 'light';
      }
    } catch (error) {
      logger.warn('Failed to detect system theme:', error);
    }
    return 'light';
  }

  /**
   * Apply theme to the popup UI
   */
  applyTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme;

    try {
      if (this.document && this.document.body) {
        // Remove existing theme classes
        this.document.body.classList.remove('light-theme', 'dark-theme');

        // Apply new theme class
        this.document.body.classList.add(`${theme}-theme`);
      }
    } catch (error) {
      logger.warn('Failed to apply theme:', error);
    }
  }

  /**
   * Initialize event listeners for settings controls
   */
  private initializeEventListeners(): void {
    if (this.document) {
      // Settings button click handler
      const settingsButton = this.document.getElementById('settings-button');
      if (settingsButton) {
        settingsButton.addEventListener('click', this.handleSettingsClick.bind(this));
      }

      // Theme toggle button handler
      const themeToggle = this.document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', this.handleThemeToggle.bind(this));
      }

      // Auto theme checkbox handler
      const autoThemeCheckbox = this.document.getElementById('auto-theme-checkbox') as HTMLInputElement;
      if (autoThemeCheckbox) {
        autoThemeCheckbox.addEventListener('change', this.handleAutoThemeChange.bind(this));
      }
    }
  }

  /**
   * Handle settings button click - open options page
   */
  public handleSettingsClick(): void {
    if (this.chrome && this.chrome.runtime) {
      this.chrome.runtime.openOptionsPage();
    }
  }

  /**
   * Handle theme toggle button click
   */
  private async handleThemeToggle(): Promise<void> {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    await this.saveThemePreference(newTheme);
    this.updateThemeUI();
  }

  /**
   * Handle auto theme checkbox change
   */
  private async handleAutoThemeChange(event: Event): Promise<void> {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      await this.saveThemePreference('auto');
      const systemTheme = this.detectSystemTheme();
      this.applyTheme(systemTheme);
    } else {
      await this.saveThemePreference(this.currentTheme);
    }
    this.updateThemeUI();
  }

  /**
   * Update theme-related UI elements
   */
  private updateThemeUI(): void {
    if (this.document) {
      const themeStatus = this.document.getElementById('theme-status');
      if (themeStatus) {
        themeStatus.textContent = this.currentTheme.charAt(0).toUpperCase() + this.currentTheme.slice(1);
      }

      const autoThemeCheckbox = this.document.getElementById('auto-theme-checkbox') as HTMLInputElement;
      if (autoThemeCheckbox) {
        autoThemeCheckbox.checked = this.preferences.theme === 'auto';
      }
    }
  }
}