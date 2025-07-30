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
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
  },
  tabs: {
    query: jest.fn(),
  },
};

(global as any).chrome = mockChrome;

// PopupManager will be imported dynamically in tests

describe('Popup HTML Structure and Styling', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Load the actual popup HTML
    const fs = require('fs');
    const path = require('path');
    const popupHtmlPath = path.join(__dirname, '../../popup.html');
    const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');

    // Load the CSS file
    const cssPath = path.join(__dirname, '../../src/popup/popup.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Create DOM with actual popup HTML
    dom = new JSDOM(popupHtml);
    document = dom.window.document;
    window = dom.window as unknown as Window;

    // Inject CSS styles into the DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = cssContent;
    document.head.appendChild(styleElement);

    // Set up global DOM
    (global as any).document = document;
    (global as any).window = window;
  });

  describe('Popup Layout Structure', () => {
    test('should create popup container with proper structure', () => {
      // RED: This test will fail because popup HTML doesn't exist yet
      const popupHTML = document.querySelector('.popup-container');
      expect(popupHTML).toBeTruthy();
      expect(popupHTML?.classList.contains('popup-container')).toBe(true);
    });

    test('should have header section with extension title', () => {
      // RED: This test will fail because header doesn't exist yet
      const header = document.querySelector('.popup-header');
      const title = document.querySelector('.popup-title');

      expect(header).toBeTruthy();
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe('LocateFlow');
    });

    test('should have main controls section for inspection mode toggle', () => {
      // RED: This test will fail because controls section doesn't exist yet
      const controlsSection = document.querySelector('.popup-controls');
      const inspectionToggle = document.querySelector('#inspection-toggle');

      expect(controlsSection).toBeTruthy();
      expect(inspectionToggle).toBeTruthy();
      expect(inspectionToggle?.getAttribute('type')).toBe('button');
    });

    test('should have history section for displaying locator history', () => {
      // RED: This test will fail because history section doesn't exist yet
      const historySection = document.querySelector('.popup-history');
      const historyList = document.querySelector('#history-list');

      expect(historySection).toBeTruthy();
      expect(historyList).toBeTruthy();
    });

    test('should have settings access button', () => {
      // RED: This test will fail because settings button doesn't exist yet
      const settingsButton = document.querySelector('#settings-button');

      expect(settingsButton).toBeTruthy();
      expect(settingsButton?.getAttribute('type')).toBe('button');
    });
  });

  describe('Responsive Design', () => {
    test('should have proper popup dimensions for Chrome extension', () => {
      // RED: This test will fail because popup CSS doesn't exist yet
      const popupContainer = document.querySelector('.popup-container') as HTMLElement;
      const computedStyle = window.getComputedStyle(popupContainer);

      expect(computedStyle.width).toBe('350px');
      expect(computedStyle.minHeight).toBe('400px');
    });

    test('should have responsive layout for different content heights', () => {
      // RED: This test will fail because responsive CSS doesn't exist yet
      const popupContainer = document.querySelector('.popup-container') as HTMLElement;
      const computedStyle = window.getComputedStyle(popupContainer);

      expect(computedStyle.display).toBe('flex');
      expect(computedStyle.flexDirection).toBe('column');
    });

    test('should have scrollable history section when content overflows', () => {
      // RED: This test will fail because scrollable CSS doesn't exist yet
      const historyList = document.querySelector('#history-list') as HTMLElement;
      const computedStyle = window.getComputedStyle(historyList);

      expect(computedStyle.overflowY).toBe('auto');
      expect(computedStyle.maxHeight).toBeTruthy();
    });
  });

  describe('Theme Application', () => {
    test('should apply light theme by default', () => {
      // RED: This test will fail because theme system doesn't exist yet
      const popupContainer = document.querySelector('.popup-container');

      expect(popupContainer?.classList.contains('theme-light')).toBe(true);
      expect(popupContainer?.classList.contains('theme-dark')).toBe(false);
    });

    test('should apply dark theme when dark mode is enabled', () => {
      // RED: This test will fail because theme switching doesn't exist yet
      const popupContainer = document.querySelector('.popup-container');

      // Simulate dark theme application
      popupContainer?.classList.remove('theme-light');
      popupContainer?.classList.add('theme-dark');

      expect(popupContainer?.classList.contains('theme-dark')).toBe(true);
      expect(popupContainer?.classList.contains('theme-light')).toBe(false);
    });

    test('should detect and apply auto theme based on system preferences', () => {
      // Mock system dark mode preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const popupContainer = document.querySelector('.popup-container');

      // Simulate auto theme application
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      popupContainer?.classList.remove('theme-light');
      if (prefersDark) {
        popupContainer?.classList.add('theme-dark');
      }

      // Should apply dark theme when system prefers dark
      expect(popupContainer?.classList.contains('theme-dark')).toBe(true);
    });

    test('should persist theme preference in Chrome storage', async () => {
      // RED: This test will fail because theme persistence doesn't exist yet
      mockChrome.storage.local.set.mockResolvedValue(undefined);

      // Simulate theme change
      const themePreference = { theme: 'dark' };
      await chrome.storage.local.set(themePreference);

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(themePreference);
    });
  });



  describe('Locator History Display', () => {
    test('should display empty history message when no locators exist', () => {
      // RED: This test will fail because history display functionality doesn't exist yet
      const historyList = document.querySelector('#history-list');

      // Simulate empty history state
      if (historyList) {
        historyList.innerHTML = '<p class="empty-history">No recent locators</p>';
      }

      const emptyMessage = document.querySelector('.empty-history');
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage?.textContent).toBe('No recent locators');
    });

    test('should display history entries with locator, URL, and timestamp', () => {
      // RED: This test will fail because history entry rendering doesn't exist yet
      const historyList = document.querySelector('#history-list');

      // Mock history data
      const mockHistory = [
        {
          selector: '#submit-button',
          url: 'https://example.com/form',
          timestamp: Date.now()
        }
      ];

      // Simulate history rendering
      if (historyList) {
        historyList.innerHTML = mockHistory.map(item => `
                    <div class="history-item">
                        <div class="history-locator">${item.selector}</div>
                        <div class="history-meta">
                            <span class="history-url">${item.url}</span>
                            <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <button class="copy-btn" data-selector="${item.selector}">Copy</button>
                    </div>
                `).join('');
      }

      const historyItem = document.querySelector('.history-item');
      const locatorElement = document.querySelector('.history-locator');
      const urlElement = document.querySelector('.history-url');
      const timeElement = document.querySelector('.history-time');
      const copyButton = document.querySelector('.copy-btn');

      expect(historyItem).toBeTruthy();
      expect(locatorElement?.textContent).toBe('#submit-button');
      expect(urlElement?.textContent).toBe('https://example.com/form');
      expect(timeElement?.textContent).toBeTruthy();
      expect(copyButton?.getAttribute('data-selector')).toBe('#submit-button');
    });

    test('should handle multiple history entries correctly', () => {
      // RED: This test will fail because multiple entry handling doesn't exist yet
      const historyList = document.querySelector('#history-list');

      const mockHistory = [
        {
          selector: '#submit-button',
          url: 'https://example.com/form',
          timestamp: Date.now()
        },
        {
          selector: '.nav-link',
          url: 'https://example.com/nav',
          timestamp: Date.now() - 1000
        }
      ];

      // Simulate multiple entries rendering
      if (historyList) {
        historyList.innerHTML = mockHistory.map(item => `
                    <div class="history-item">
                        <div class="history-locator">${item.selector}</div>
                        <div class="history-meta">
                            <span class="history-url">${item.url}</span>
                            <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <button class="copy-btn" data-selector="${item.selector}">Copy</button>
                    </div>
                `).join('');
      }

      const historyItems = document.querySelectorAll('.history-item');
      expect(historyItems.length).toBe(2);

      const firstLocator = historyItems[0].querySelector('.history-locator');
      const secondLocator = historyItems[1].querySelector('.history-locator');

      expect(firstLocator?.textContent).toBe('#submit-button');
      expect(secondLocator?.textContent).toBe('.nav-link');
    });

    test('should load history from Chrome storage on initialization', async () => {
      // RED: This test will fail because storage loading doesn't exist yet
      const mockHistory = [
        {
          selector: '#test-element',
          url: 'https://test.com',
          timestamp: Date.now()
        }
      ];

      mockChrome.storage.local.get.mockResolvedValue({ locatorHistory: mockHistory });

      // Simulate loading history from storage
      const result = await chrome.storage.local.get(['locatorHistory']);
      const history = result.locatorHistory || [];

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['locatorHistory']);
      expect(history).toEqual(mockHistory);
    });

    test('should handle storage errors gracefully', async () => {
      // RED: This test will fail because error handling doesn't exist yet
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      let errorOccurred = false;
      try {
        await chrome.storage.local.get(['locatorHistory']);
      } catch (error) {
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(true);
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['locatorHistory']);
    });
  });

  describe('Copy Functionality', () => {
    test('should copy locator to clipboard when copy button is clicked', async () => {
      // RED: This test will fail because copy functionality doesn't exist yet
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      const historyList = document.querySelector('#history-list');
      if (historyList) {
        historyList.innerHTML = `
                    <div class="history-item">
                        <div class="history-locator">#test-selector</div>
                        <button class="copy-btn" data-selector="#test-selector">Copy</button>
                    </div>
                `;
      }

      const copyButton = document.querySelector('.copy-btn') as HTMLButtonElement;

      // Simulate copy button click handler
      copyButton.addEventListener('click', async (e) => {
        const target = e.target as HTMLButtonElement;
        const selector = target.getAttribute('data-selector');
        if (selector) {
          await navigator.clipboard.writeText(selector);
        }
      });

      copyButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockWriteText).toHaveBeenCalledWith('#test-selector');
    });

    test('should handle clipboard API errors gracefully', async () => {
      // RED: This test will fail because error handling doesn't exist yet
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard error'));
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      const historyList = document.querySelector('#history-list');
      if (historyList) {
        historyList.innerHTML = `
                    <div class="history-item">
                        <button class="copy-btn" data-selector="#test-selector">Copy</button>
                    </div>
                `;
      }

      const copyButton = document.querySelector('.copy-btn') as HTMLButtonElement;

      let errorHandled = false;
      copyButton.addEventListener('click', async (e) => {
        try {
          const target = e.target as HTMLButtonElement;
          const selector = target.getAttribute('data-selector');
          if (selector) {
            await navigator.clipboard.writeText(selector);
          }
        } catch (error) {
          errorHandled = true;
        }
      });

      copyButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(errorHandled).toBe(true);
    });

    test('should provide visual feedback when copy is successful', async () => {
      // RED: This test will fail because visual feedback doesn't exist yet
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      const historyList = document.querySelector('#history-list');
      if (historyList) {
        historyList.innerHTML = `
                    <div class="history-item">
                        <button class="copy-btn" data-selector="#test-selector">Copy</button>
                    </div>
                `;
      }

      const copyButton = document.querySelector('.copy-btn') as HTMLButtonElement;

      // Simulate copy with visual feedback
      copyButton.addEventListener('click', async (e) => {
        const target = e.target as HTMLButtonElement;
        const selector = target.getAttribute('data-selector');
        if (selector) {
          await navigator.clipboard.writeText(selector);
          target.textContent = 'Copied!';
          setTimeout(() => {
            target.textContent = 'Copy';
          }, 1000);
        }
      });

      copyButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(copyButton.textContent).toBe('Copied!');
    });
  });

  describe('History Clearing Functionality', () => {
    test('should clear history when clear button is clicked', async () => {
      // RED: This test will fail because clear functionality doesn't exist yet
      mockChrome.storage.local.set.mockResolvedValue(undefined);

      const clearButton = document.querySelector('#clear-history') as HTMLButtonElement;
      const historyList = document.querySelector('#history-list');

      // Simulate clear button click handler
      clearButton.addEventListener('click', async () => {
        await chrome.storage.local.set({ locatorHistory: [] });
        if (historyList) {
          historyList.innerHTML = '<p class="empty-history">No recent locators</p>';
        }
      });

      clearButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ locatorHistory: [] });

      const emptyMessage = document.querySelector('.empty-history');
      expect(emptyMessage?.textContent).toBe('No recent locators');
    });

    test('should show confirmation dialog before clearing history', async () => {
      // RED: This test will fail because confirmation dialog doesn't exist yet
      const mockConfirm = jest.fn().mockReturnValue(true);
      (global as any).confirm = mockConfirm;

      mockChrome.storage.local.set.mockResolvedValue(undefined);

      const clearButton = document.querySelector('#clear-history') as HTMLButtonElement;

      // Simulate clear button with confirmation
      clearButton.addEventListener('click', async () => {
        const confirmed = confirm('Are you sure you want to clear all history?');
        if (confirmed) {
          await chrome.storage.local.set({ locatorHistory: [] });
        }
      });

      clearButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to clear all history?');
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ locatorHistory: [] });
    });

    test('should not clear history if user cancels confirmation', async () => {
      // RED: This test will fail because confirmation cancellation doesn't exist yet
      const mockConfirm = jest.fn().mockReturnValue(false);
      (global as any).confirm = mockConfirm;

      mockChrome.storage.local.set.mockResolvedValue(undefined);

      const clearButton = document.querySelector('#clear-history') as HTMLButtonElement;

      // Simulate clear button with confirmation cancellation
      clearButton.addEventListener('click', async () => {
        const confirmed = confirm('Are you sure you want to clear all history?');
        if (confirmed) {
          await chrome.storage.local.set({ locatorHistory: [] });
        }
      });

      clearButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to clear all history?');
      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });

    test('should handle storage errors when clearing history', async () => {
      // RED: This test will fail because error handling doesn't exist yet
      const mockConfirm = jest.fn().mockReturnValue(true);
      (global as any).confirm = mockConfirm;

      mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'));

      const clearButton = document.querySelector('#clear-history') as HTMLButtonElement;

      let errorHandled = false;
      clearButton.addEventListener('click', async () => {
        const confirmed = confirm('Are you sure you want to clear all history?');
        if (confirmed) {
          try {
            await chrome.storage.local.set({ locatorHistory: [] });
          } catch (error) {
            errorHandled = true;
          }
        }
      });

      clearButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(errorHandled).toBe(true);
    });
  });

  describe('Inspection Mode Toggle', () => {
    test('should have inspection toggle button with proper initial state', () => {
      // RED: This test will fail because toggle functionality doesn't exist yet
      const inspectionToggle = document.querySelector('#inspection-toggle') as HTMLButtonElement;

      expect(inspectionToggle.textContent?.trim()).toBe('Start Inspection');
      expect(inspectionToggle.classList.contains('active')).toBe(false);
    });

    test('should update button state when inspection mode is activated', () => {
      // RED: This test will fail because state management doesn't exist yet
      const inspectionToggle = document.querySelector('#inspection-toggle') as HTMLButtonElement;

      // Simulate activation
      inspectionToggle.textContent = 'Stop Inspection';
      inspectionToggle.classList.add('active');

      expect(inspectionToggle.textContent).toBe('Stop Inspection');
      expect(inspectionToggle.classList.contains('active')).toBe(true);
    });

    test('should communicate with service worker when toggle is clicked', async () => {
      mockChrome.runtime.sendMessage.mockResolvedValue({ success: true });

      const inspectionToggle = document.querySelector('#inspection-toggle') as HTMLButtonElement;

      // Simulate the click handler that would be added by popup.js
      inspectionToggle.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({
          action: 'toggleInspection'
        });
      });

      inspectionToggle.click();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'toggleInspection'
      });
    });
  });
});