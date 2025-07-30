/**
 * @fileoverview Tests for Service Worker lifecycle management
 * 
 * This test suite follows TDD methodology to ensure proper service worker
 * functionality including activation, message handling, cross-tab communication,
 * and extension icon/badge updates.
 * 
 * Requirements tested:
 * - 1.1: Extension inspection mode activation
 * - 5.2: Main extension popup display with controls and history
 */

import { ServiceWorker } from '../../src/background/service-worker';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    onActivated: {
      addListener: jest.fn()
    },
    onUpdated: {
      addListener: jest.fn()
    }
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setIcon: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Setup Chrome API mock
beforeEach(() => {
  // Ensure we have a complete Chrome mock
  (global as any).chrome = {
    ...mockChrome,
    runtime: {
      ...mockChrome.runtime,
      onInstalled: {
        addListener: jest.fn()
      },
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      }
    },
    tabs: {
      ...mockChrome.tabs,
      onActivated: {
        addListener: jest.fn()
      },
      onUpdated: {
        addListener: jest.fn()
      },
      onRemoved: {
        addListener: jest.fn()
      }
    }
  };

  // Reset all mocks
  jest.clearAllMocks();

  // Setup default mock implementations
  mockChrome.tabs.query.mockResolvedValue([]);
  mockChrome.scripting.executeScript.mockResolvedValue([]);
  mockChrome.tabs.sendMessage.mockResolvedValue({});
});

describe('ServiceWorker', () => {
  let serviceWorker: ServiceWorker;

  beforeEach(() => {
    serviceWorker = new ServiceWorker();
  });

  describe('Extension Lifecycle Management', () => {
    it('should initialize service worker on construction', () => {
      // RED: This test should fail because ServiceWorker class doesn't exist yet
      expect(serviceWorker).toBeDefined();
      expect(serviceWorker).toBeInstanceOf(ServiceWorker);
    });

    it('should register event listeners on initialization', () => {
      // RED: This test should fail because initialize method doesn't exist
      serviceWorker.initialize();

      expect((global as any).chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
      expect((global as any).chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect((global as any).chrome.tabs.onActivated.addListener).toHaveBeenCalled();
      expect((global as any).chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
    });

    it('should handle extension installation', async () => {
      // RED: This test should fail because handleInstalled method doesn't exist
      await serviceWorker.handleInstalled();

      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#007acc' });
    });
  });

  describe('Message Handling', () => {
    it('should handle activate inspection mode message', async () => {
      // RED: This test should fail because handleMessage method doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'https://example.com'
      }]);

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['content/content-script.js']
      });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle deactivate inspection mode message', async () => {
      // RED: This test should fail because handleMessage method doesn't exist
      const message = { action: 'deactivateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'deactivateInspection'
      });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle get inspection state message', async () => {
      // RED: This test should fail because handleMessage and getInspectionState don't exist
      const message = { action: 'getInspectionState', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        isActive: false
      });
    });

    it('should handle unknown message types gracefully', async () => {
      // RED: This test should fail because handleMessage method doesn't exist
      const message = { action: 'unknownAction' };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown action: unknownAction'
      });
    });
  });

  describe('Cross-Tab Communication', () => {
    it('should track inspection state per tab', async () => {
      // RED: This test should fail because state management methods don't exist
      const tabId = 123;

      await serviceWorker.setInspectionState(tabId, true);
      const state = await serviceWorker.getInspectionState(tabId);

      expect(state).toBe(true);
    });

    it('should clear inspection state when tab is closed', async () => {
      // RED: This test should fail because handleTabRemoved method doesn't exist
      const tabId = 123;

      await serviceWorker.setInspectionState(tabId, true);
      await serviceWorker.handleTabRemoved(tabId);

      const state = await serviceWorker.getInspectionState(tabId);
      expect(state).toBe(false);
    });

    it('should broadcast state changes to all tabs', async () => {
      // RED: This test should fail because broadcastStateChange method doesn't exist
      const tabId = 123;
      mockChrome.tabs.query.mockResolvedValue([
        { id: 123 },
        { id: 456 }
      ]);

      await serviceWorker.broadcastStateChange(tabId, true);

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({});
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'inspectionStateChanged',
        isActive: true
      });
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(456, {
        action: 'inspectionStateChanged',
        isActive: true
      });
    });
  });

  describe('Extension Icon and Badge Updates', () => {
    it('should update badge when inspection mode is activated', async () => {
      // RED: This test should fail because updateBadge method doesn't exist
      const tabId = 123;

      await serviceWorker.updateBadge(tabId, true);

      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({
        text: '●',
        tabId: 123
      });
      expect(mockChrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: '#ff4444'
      });
    });

    it('should clear badge when inspection mode is deactivated', async () => {
      // RED: This test should fail because updateBadge method doesn't exist
      const tabId = 123;

      await serviceWorker.updateBadge(tabId, false);

      expect(mockChrome.action.setBadgeText).toHaveBeenCalledWith({
        text: '',
        tabId: 123
      });
    });

    it('should update icon based on inspection state', async () => {
      // RED: This test should fail because updateIcon method doesn't exist
      const tabId = 123;

      await serviceWorker.updateIcon(tabId, true);

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: {
          '16': 'icons/icon-active-16.png',
          '32': 'icons/icon-active-32.png',
          '48': 'icons/icon-active-48.png',
          '128': 'icons/icon-active-128.png'
        },
        tabId: 123
      });
    });

    it('should use default icon when inspection is inactive', async () => {
      // RED: This test should fail because updateIcon method doesn't exist
      const tabId = 123;

      await serviceWorker.updateIcon(tabId, false);

      expect(mockChrome.action.setIcon).toHaveBeenCalledWith({
        path: {
          '16': 'icons/icon-16.png',
          '32': 'icons/icon-32.png',
          '48': 'icons/icon-48.png',
          '128': 'icons/icon-128.png'
        },
        tabId: 123
      });
    });
  });

  describe('Content Script Injection with Retry Logic', () => {
    it('should inject content script successfully on first attempt', async () => {
      // RED: This test should fail because enhanced injection doesn't exist yet
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'https://example.com'
      }]);
      mockChrome.scripting.executeScript.mockResolvedValue([]);

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(1);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should retry content script injection with exponential backoff on failure', async () => {
      // RED: This test should fail because retry logic doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'https://example.com'
      }]);

      // Mock first two attempts to fail, third to succeed
      mockChrome.scripting.executeScript
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Tab not ready'))
        .mockResolvedValueOnce([]);

      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 0 as any;
      });

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(3);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });

      (global.setTimeout as unknown as jest.Mock).mockRestore();
    });

    it('should fail after maximum retry attempts with exponential backoff', async () => {
      // RED: This test should fail because retry logic doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'https://example.com'
      }]);
      mockChrome.scripting.executeScript.mockRejectedValue(new Error('Persistent failure'));

      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 0 as any;
      });

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(3); // Max retries
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to inject content script after 3 attempts: Persistent failure'
      });

      (global.setTimeout as unknown as jest.Mock).mockRestore();
    });

    it('should use correct exponential backoff delays', async () => {
      // RED: This test should fail because exponential backoff timing doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'https://example.com'
      }]);
      mockChrome.scripting.executeScript.mockRejectedValue(new Error('Always fails'));

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 0 as any;
      });

      await serviceWorker.handleMessage(message, sender, sendResponse);

      // Should be called with delays: 1000ms, 2000ms (exponential backoff)
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 1000);
      expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 2000);

      setTimeoutSpy.mockRestore();
    });

    it('should handle unsupported pages with fallback mechanism', async () => {
      // RED: This test should fail because fallback mechanism doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      // Mock tab query to return unsupported page
      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'chrome://extensions/'
      }]);

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Content script injection not supported on this page type'
      });
    });

    it('should detect and handle chrome:// pages', async () => {
      // RED: This test should fail because page type detection doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'chrome://settings/'
      }]);

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Content script injection not supported on this page type'
      });
    });

    it('should detect and handle extension pages', async () => {
      // RED: This test should fail because page type detection doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'chrome-extension://abcdef123456/popup.html'
      }]);

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Content script injection not supported on this page type'
      });
    });

    it('should detect and handle file:// pages', async () => {
      // RED: This test should fail because page type detection doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'file:///C:/Users/test/document.html'
      }]);

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Content script injection not supported on this page type'
      });
    });

    it('should allow injection on supported http pages', async () => {
      // RED: This test should fail because page type detection doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'http://example.com'
      }]);
      mockChrome.scripting.executeScript.mockResolvedValue([]);

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.scripting.executeScript).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should allow injection on supported https pages', async () => {
      // RED: This test should fail because page type detection doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'https://example.com'
      }]);
      mockChrome.scripting.executeScript.mockResolvedValue([]);

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.scripting.executeScript).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle tab query failures gracefully', async () => {
      // RED: This test should fail because tab query error handling doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockRejectedValue(new Error('Tab query failed'));

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to query tab information: Tab query failed'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle content script injection failures gracefully', async () => {
      // RED: This test should fail because error handling doesn't exist
      const message = { action: 'activateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.query.mockResolvedValue([{
        id: 123,
        url: 'https://example.com'
      }]);
      mockChrome.scripting.executeScript.mockRejectedValue(new Error('Injection failed'));

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to inject content script after 3 attempts: Injection failed'
      });
    });

    it('should handle tab communication failures gracefully', async () => {
      // RED: This test should fail because error handling doesn't exist
      const message = { action: 'deactivateInspection', tabId: 123 };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Tab not found'));

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to communicate with tab: Tab not found'
      });
    });

    it('should log errors to console for debugging', async () => {
      // RED: This test should fail because error logging doesn't exist
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      await serviceWorker.logError('TestOperation', error, { tabId: 123 });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ServiceWorker] TestOperation failed:',
        error,
        { tabId: 123 }
      );

      consoleSpy.mockRestore();
    });
  });
});