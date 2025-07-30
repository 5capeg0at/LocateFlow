/**
 * @jest-environment jsdom
 */

import { JSDOM } from 'jsdom';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    openOptionsPage: jest.fn(),
  },
};

(global as any).chrome = mockChrome;

describe('Settings Manager TDD', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create minimal DOM for testing
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head></head>
      <body>
        <div class="popup-container">
          <button id="settings-button">Settings</button>
          <div id="theme-toggle-container">
            <button id="theme-toggle">Theme</button>
            <span id="theme-status">Light</span>
          </div>
          <div id="auto-theme-container">
            <input type="checkbox" id="auto-theme-checkbox" />
            <label for="auto-theme-checkbox">Auto Theme</label>
          </div>
        </div>
      </body>
      </html>
    `);

    document = dom.window.document;
    window = dom.window as unknown as Window;

    // Set up global environment for tests
    (global as any).document = document;
    (global as any).window = window;
    (global as any).chrome = mockChrome;

    // Clear ALL module caches to ensure fresh imports
    Object.keys(require.cache).forEach(key => {
      if (key.includes('settings-manager') || key.includes('data-models')) {
        delete require.cache[key];
      }
    });
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Settings Page Navigation', () => {
    test('should create SettingsManager instance successfully', () => {
      const { SettingsManager } = require('../../src/popup/settings-manager');
      const settingsManager = new SettingsManager({
        document,
        window,
        chrome: mockChrome
      });
      expect(settingsManager).toBeDefined();
    });

    test('should handle settings button click and open options page', () => {
      const { SettingsManager } = require('../../src/popup/settings-manager');
      const settingsManager = new SettingsManager({
        document,
        window,
        chrome: mockChrome
      });

      const settingsButton = document.getElementById('settings-button');
      expect(settingsButton).toBeTruthy();

      // Test that the method exists and can be called
      expect(typeof settingsManager.handleSettingsClick).toBe('function');

      // Test the method directly
      settingsManager.handleSettingsClick();
      expect(mockChrome.runtime.openOptionsPage).toHaveBeenCalled();
    });
  });

  describe('Theme Toggle Functionality', () => {
    test('should initialize theme and load preferences', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        preferences: { theme: 'dark' }
      });

      const { SettingsManager } = require('../../src/popup/settings-manager');
      const settingsManager = new SettingsManager({
        document,
        window,
        chrome: mockChrome
      });

      await settingsManager.initializeTheme();
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['preferences']);
      expect(document.body.classList.contains('dark-theme')).toBe(true);
    });

    test('should save theme preference to storage', async () => {
      const { SettingsManager } = require('../../src/popup/settings-manager');
      const settingsManager = new SettingsManager({
        document,
        window,
        chrome: mockChrome
      });

      await settingsManager.saveThemePreference('dark');
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        preferences: expect.objectContaining({
          theme: 'dark'
        })
      });
    });
  });

  describe('Auto Theme Detection', () => {
    test('should detect system theme preference', () => {
      // Mock matchMedia for system theme detection
      const mockMatchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });



      const { SettingsManager } = require('../../src/popup/settings-manager');
      const settingsManager = new SettingsManager({
        document,
        window,
        chrome: mockChrome
      });

      const systemTheme = settingsManager.detectSystemTheme();
      expect(systemTheme).toBe('dark');
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    test('should apply theme to document body', () => {


      const { SettingsManager } = require('../../src/popup/settings-manager');
      const settingsManager = new SettingsManager({
        document,
        window,
        chrome: mockChrome
      });

      settingsManager.applyTheme('dark');

      expect(document.body.classList.contains('dark-theme')).toBe(true);
      expect(document.body.classList.contains('light-theme')).toBe(false);
    });
  });

  describe('Preference Management', () => {
    test('should load preferences from storage', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        preferences: {
          theme: 'dark',
          historyLimit: 50,
          showConfidenceExplanations: true
        }
      });

      const { SettingsManager } = require('../../src/popup/settings-manager');
      const settingsManager = new SettingsManager({
        document,
        window,
        chrome: mockChrome
      });

      const preferences = await settingsManager.loadPreferences();
      expect(preferences.theme).toBe('dark');
      expect(preferences.historyLimit).toBe(50);
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['preferences']);
    });

    test('should return default preferences when storage is empty', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      const { SettingsManager } = require('../../src/popup/settings-manager');
      const settingsManager = new SettingsManager({
        document,
        window,
        chrome: mockChrome
      });

      const preferences = await settingsManager.loadPreferences();
      expect(preferences.theme).toBe('auto');
      expect(preferences.historyLimit).toBe(100);
    });

    test('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const { SettingsManager } = require('../../src/popup/settings-manager');
      const settingsManager = new SettingsManager({
        document,
        window,
        chrome: mockChrome
      });

      const preferences = await settingsManager.loadPreferences();
      expect(preferences).toEqual(expect.objectContaining({
        theme: 'auto' // Should fallback to defaults
      }));
    });
  });
});