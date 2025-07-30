/**
 * @fileoverview Tests for PopupManager - TDD implementation for Task 7.2
 * 
 * This test suite covers locator history display functionality with TDD approach.
 * 
 * Requirements Coverage:
 * - Requirement 5.2: Display popup window with main controls and locator history
 * - Requirement 5.3: Each entry shows locator, URL, and timestamp
 * - Requirement 5.4: User can copy any locator with single click
 * - Requirement 5.5: Allow entire locator history to be cleared
 * 
 * TDD Approach:
 * - RED: Write failing tests for history display functionality
 * - GREEN: Implement minimal code to pass tests
 * - REFACTOR: Improve code structure while keeping tests green
 */

import { PopupManager } from '../../src/popup/popup';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
  },
};

// Mock global functions
const mockConfirm = jest.fn();
const mockNavigator = {
  clipboard: {
    writeText: jest.fn(),
  },
};

describe('PopupManager History Display', () => {
  let popupManager: PopupManager;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup global mocks
    (global as any).chrome = mockChrome;
    (global as any).confirm = mockConfirm;

    // Mock navigator.clipboard properly
    Object.defineProperty(navigator, 'clipboard', {
      value: mockNavigator.clipboard,
      writable: true,
    });

    // Setup DOM
    document.body.innerHTML = `
      <div class="popup-container theme-light">
        <header class="popup-header">
          <h1 class="popup-title">LocateFlow</h1>
        </header>
        <main class="popup-main">
          <section class="popup-controls">
            <button id="inspection-toggle" type="button" class="inspection-toggle-btn">
              Start Inspection
            </button>
          </section>
          <section class="popup-history">
            <h2 class="history-title">Recent Locators</h2>
            <div id="history-list" class="history-list">
              <!-- History items will be populated by JavaScript -->
            </div>
            <button id="clear-history" type="button" class="clear-history-btn">
              Clear History
            </button>
          </section>
        </main>
        <footer class="popup-footer">
          <button id="settings-button" type="button" class="settings-btn">
            Settings
          </button>
        </footer>
      </div>
    `;

    // Setup default mock responses
    mockChrome.storage.local.get.mockResolvedValue({ locatorHistory: [] });
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockNavigator.clipboard.writeText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Clean up any event listeners
    if (popupManager) {
      // PopupManager doesn't have a cleanup method, but we reset the DOM
      document.body.innerHTML = '';
    }
  });

  describe('Initialization', () => {
    test('should create PopupManager instance successfully', () => {
      // GREEN: This should pass because PopupManager exists and is exported
      expect(() => {
        popupManager = new PopupManager();
      }).not.toThrow();

      expect(popupManager).toBeDefined();
    });

    test('should load empty history on initialization', async () => {
      // GREEN: This should pass because loadHistory is called in constructor
      mockChrome.storage.local.get.mockResolvedValue({ locatorHistory: [] });

      popupManager = new PopupManager();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['locatorHistory']);

      const historyList = document.querySelector('#history-list');
      const emptyMessage = historyList?.querySelector('.empty-history');
      expect(emptyMessage?.textContent).toBe('No recent locators');
    });

    test('should handle storage loading errors gracefully', async () => {
      // GREEN: This should pass because error handling exists
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      popupManager = new PopupManager();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load history:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('History Display', () => {
    test('should display history entries with locator, URL, and timestamp', async () => {
      // GREEN: This should pass because displayHistory method exists
      const mockHistory = [
        {
          selector: '#submit-button',
          url: 'https://example.com/form',
          timestamp: 1640995200000
        }
      ];

      mockChrome.storage.local.get.mockResolvedValue({ locatorHistory: mockHistory });

      popupManager = new PopupManager();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      const historyList = document.querySelector('#history-list');
      const historyItem = historyList?.querySelector('.history-item');
      const locatorElement = historyItem?.querySelector('.history-locator');
      const urlElement = historyItem?.querySelector('.history-url');
      const timeElement = historyItem?.querySelector('.history-time');
      const copyButton = historyItem?.querySelector('.copy-btn');

      expect(historyItem).toBeTruthy();
      expect(locatorElement?.textContent).toBe('#submit-button');
      expect(urlElement?.textContent).toBe('https://example.com/form');
      expect(timeElement?.textContent).toBeTruthy();
      expect(copyButton?.getAttribute('data-selector')).toBe('#submit-button');
    });

    test('should handle multiple history entries correctly', async () => {
      // GREEN: This should pass because displayHistory handles arrays
      const mockHistory = [
        {
          selector: '#submit-button',
          url: 'https://example.com/form',
          timestamp: 1640995200000
        },
        {
          selector: '.nav-link',
          url: 'https://example.com/nav',
          timestamp: 1640995100000
        }
      ];

      mockChrome.storage.local.get.mockResolvedValue({ locatorHistory: mockHistory });

      popupManager = new PopupManager();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      const historyList = document.querySelector('#history-list');
      const historyItems = historyList?.querySelectorAll('.history-item');

      expect(historyItems?.length).toBe(2);

      const firstLocator = historyItems?.[0].querySelector('.history-locator');
      const secondLocator = historyItems?.[1].querySelector('.history-locator');

      expect(firstLocator?.textContent).toBe('#submit-button');
      expect(secondLocator?.textContent).toBe('.nav-link');
    });
  });

  describe('Copy Functionality', () => {
    test('should copy locator to clipboard when copy button is clicked', async () => {
      // GREEN: This should pass because copy functionality exists
      const mockHistory = [
        {
          selector: '#test-selector',
          url: 'https://test.com',
          timestamp: Date.now()
        }
      ];

      mockChrome.storage.local.get.mockResolvedValue({ locatorHistory: mockHistory });

      popupManager = new PopupManager();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      const copyButton = document.querySelector('.copy-btn') as HTMLButtonElement;
      expect(copyButton).toBeTruthy();

      copyButton.click();

      // Wait for async clipboard operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockNavigator.clipboard.writeText).toHaveBeenCalledWith('#test-selector');
    });

    test('should handle clipboard API errors gracefully', async () => {
      // GREEN: This should pass because error handling exists
      const mockHistory = [
        {
          selector: '#test-selector',
          url: 'https://test.com',
          timestamp: Date.now()
        }
      ];

      mockChrome.storage.local.get.mockResolvedValue({ locatorHistory: mockHistory });
      mockNavigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      popupManager = new PopupManager();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      const copyButton = document.querySelector('.copy-btn') as HTMLButtonElement;
      copyButton.click();

      // Wait for async clipboard operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('History Clearing', () => {
    test('should show confirmation dialog before clearing history', async () => {
      // GREEN: This should pass because confirmation dialog exists
      mockConfirm.mockReturnValue(true);

      popupManager = new PopupManager();

      const clearButton = document.querySelector('#clear-history') as HTMLButtonElement;
      clearButton.click();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to clear all history?');
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ locatorHistory: [] });
    });

    test('should not clear history if user cancels confirmation', async () => {
      // GREEN: This should pass because confirmation cancellation exists
      mockConfirm.mockReturnValue(false);

      popupManager = new PopupManager();

      const clearButton = document.querySelector('#clear-history') as HTMLButtonElement;
      clearButton.click();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to clear all history?');
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });

    test('should handle storage errors when clearing history', async () => {
      // GREEN: This should pass because error handling exists
      mockConfirm.mockReturnValue(true);
      mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      popupManager = new PopupManager();

      const clearButton = document.querySelector('#clear-history') as HTMLButtonElement;
      clearButton.click();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear history:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});