/**
 * @fileoverview Tests for Storage Coordination in Service Worker
 * 
 * This test suite follows TDD methodology to ensure proper storage operations
 * coordination between extension components, preference updates, and history
 * management through the service worker.
 * 
 * Requirements tested:
 * - 5.1: Automatic history saving when locators are copied
 * - 6.3: Persisting theme preferences across browser sessions using local storage
 */

import { ServiceWorker } from '../../src/background/service-worker';
import { LocatorData, UserPreferences, createDefaultUserPreferences, ElementPosition } from '../../src/shared/data-models';

// Helper function to create valid ElementPosition
function createElementPosition(x: number, y: number, width: number, height: number): ElementPosition {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    bottom: y + height,
    right: x + width
  };
}

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
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn()
    }
  }
};

// Setup Chrome API mock
beforeEach(() => {
  (global as any).chrome = mockChrome;
  jest.clearAllMocks();

  // Setup default mock implementations
  mockChrome.tabs.query.mockResolvedValue([]);
  mockChrome.scripting.executeScript.mockResolvedValue([]);
  mockChrome.tabs.sendMessage.mockResolvedValue({});
  mockChrome.storage.local.get.mockResolvedValue({});
  mockChrome.storage.local.set.mockResolvedValue(undefined);
  mockChrome.storage.local.getBytesInUse.mockResolvedValue(1024);
});

describe('Storage Coordination', () => {
  let serviceWorker: ServiceWorker;

  beforeEach(() => {
    serviceWorker = new ServiceWorker();
  });

  describe('Preference Updates Coordination', () => {
    it('should handle preference update messages from popup', async () => {
      // RED: This test should fail because preference update handling doesn't exist
      const message = {
        action: 'updatePreferences',
        preferences: {
          theme: 'dark' as const,
          defaultLocatorTypes: ['css', 'xpath'] as const,
          historyLimit: 50,
          showConfidenceExplanations: true,
          enableScreenshots: false,
          highlightColor: '#ff0000'
        }
      };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        locateflow_preferences: message.preferences
      });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should broadcast preference changes to all tabs', async () => {
      // RED: This test should fail because preference broadcasting doesn't exist
      const preferences: UserPreferences = {
        theme: 'dark',
        defaultLocatorTypes: ['css', 'xpath'],
        historyLimit: 50,
        showConfidenceExplanations: true,
        enableScreenshots: false,
        highlightColor: '#ff0000'
      };

      mockChrome.tabs.query.mockResolvedValue([
        { id: 123 },
        { id: 456 }
      ]);

      await serviceWorker.broadcastPreferenceUpdate(preferences);

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({});
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'preferencesUpdated',
        preferences
      });
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(456, {
        action: 'preferencesUpdated',
        preferences
      });
    });

    it('should handle preference retrieval messages', async () => {
      // RED: This test should fail because preference retrieval doesn't exist
      const storedPreferences = createDefaultUserPreferences();
      storedPreferences.theme = 'dark';

      mockChrome.storage.local.get.mockResolvedValue({
        locateflow_preferences: storedPreferences
      });

      const message = { action: 'getPreferences' };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('locateflow_preferences');
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        preferences: storedPreferences
      });
    });

    it('should return default preferences when none exist', async () => {
      // RED: This test should fail because default preference handling doesn't exist
      mockChrome.storage.local.get.mockResolvedValue({});

      const message = { action: 'getPreferences' };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        preferences: createDefaultUserPreferences()
      });
    });

    it('should validate preferences before saving', async () => {
      // RED: This test should fail because preference validation doesn't exist
      const invalidPreferences = {
        theme: 'invalid-theme',
        historyLimit: -1
      };

      const message = {
        action: 'updatePreferences',
        preferences: invalidPreferences
      };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid preferences data'
      });
    });
  });

  describe('History Management Coordination', () => {
    it('should handle history save messages from content scripts', async () => {
      // RED: This test should fail because history save handling doesn't exist
      const locatorData: LocatorData = {
        id: 'test-id',
        timestamp: Date.now(),
        url: 'https://example.com',
        elementInfo: {
          tagName: 'button',
          textContent: 'Click me',
          attributes: { id: 'submit-btn' },
          position: createElementPosition(100, 200, 80, 30),
          xpath: '//button[@id="submit-btn"]'
        },
        strategies: []
      };

      const message = {
        action: 'saveToHistory',
        locatorData
      };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      mockChrome.storage.local.get.mockImplementation((key) => {
        if (key === 'locateflow_preferences') {
          return Promise.resolve({ locateflow_preferences: createDefaultUserPreferences() });
        }
        if (key === 'locateflow_history') {
          return Promise.resolve({ locateflow_history: [] });
        }
        return Promise.resolve({});
      });

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        locateflow_history: [locatorData]
      });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle history retrieval messages', async () => {
      // RED: This test should fail because history retrieval doesn't exist
      const historyData: LocatorData[] = [
        {
          id: 'test-1',
          timestamp: Date.now() - 1000,
          url: 'https://example.com',
          elementInfo: {
            tagName: 'button',
            textContent: 'Click me',
            attributes: { id: 'btn-1' },
            position: createElementPosition(100, 200, 80, 30),
            xpath: '//button[@id="btn-1"]'
          },
          strategies: []
        }
      ];

      mockChrome.storage.local.get.mockImplementation((key) => {
        if (key === 'locateflow_history') {
          return Promise.resolve({ locateflow_history: historyData });
        }
        return Promise.resolve({});
      });

      const message = { action: 'getHistory' };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('locateflow_history');
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        history: historyData
      });
    });

    it('should handle history clearing messages', async () => {
      // RED: This test should fail because history clearing doesn't exist
      const message = { action: 'clearHistory' };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        locateflow_history: []
      });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should enforce history limits when saving', async () => {
      // RED: This test should fail because history limit enforcement doesn't exist
      const preferences = createDefaultUserPreferences();
      preferences.historyLimit = 2;

      const existingHistory: LocatorData[] = [
        {
          id: 'old-2',
          timestamp: Date.now() - 1000,
          url: 'https://example.com',
          elementInfo: {
            tagName: 'div',
            textContent: 'Old 2',
            attributes: {},
            position: createElementPosition(0, 0, 100, 50),
            xpath: '//div[2]'
          },
          strategies: []
        },
        {
          id: 'old-1',
          timestamp: Date.now() - 2000,
          url: 'https://example.com',
          elementInfo: {
            tagName: 'div',
            textContent: 'Old 1',
            attributes: {},
            position: createElementPosition(0, 0, 100, 50),
            xpath: '//div[1]'
          },
          strategies: []
        }
      ];

      const newLocatorData: LocatorData = {
        id: 'new-1',
        timestamp: Date.now(),
        url: 'https://example.com',
        elementInfo: {
          tagName: 'button',
          textContent: 'New button',
          attributes: { id: 'new-btn' },
          position: createElementPosition(100, 200, 80, 30),
          xpath: '//button[@id="new-btn"]'
        },
        strategies: []
      };

      mockChrome.storage.local.get.mockImplementation((key) => {
        if (key === 'locateflow_preferences') {
          return Promise.resolve({ locateflow_preferences: preferences });
        }
        if (key === 'locateflow_history') {
          return Promise.resolve({ locateflow_history: existingHistory });
        }
        return Promise.resolve({});
      });

      const message = {
        action: 'saveToHistory',
        locatorData: newLocatorData
      };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      // Should keep only the 2 most recent entries (new one + most recent old one)
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        locateflow_history: [newLocatorData, existingHistory[0]]
      });
    });
  });

  describe('Storage Synchronization', () => {
    it('should coordinate storage operations between components', async () => {
      // RED: This test should fail because storage coordination doesn't exist
      const preferences = createDefaultUserPreferences();
      preferences.theme = 'dark';

      const locatorData: LocatorData = {
        id: 'sync-test',
        timestamp: Date.now(),
        url: 'https://example.com',
        elementInfo: {
          tagName: 'input',
          textContent: '',
          attributes: { type: 'text', name: 'username' },
          position: createElementPosition(50, 100, 200, 40),
          xpath: '//input[@name="username"]'
        },
        strategies: []
      };

      // Simulate concurrent operations
      const updatePreferencesMessage = {
        action: 'updatePreferences',
        preferences
      };
      const saveHistoryMessage = {
        action: 'saveToHistory',
        locatorData
      };

      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse1 = jest.fn();
      const sendResponse2 = jest.fn();

      mockChrome.storage.local.get.mockImplementation((key) => {
        if (key === 'locateflow_preferences') {
          return Promise.resolve({ locateflow_preferences: createDefaultUserPreferences() });
        }
        if (key === 'locateflow_history') {
          return Promise.resolve({ locateflow_history: [] });
        }
        return Promise.resolve({});
      });

      // Execute operations concurrently
      await Promise.all([
        serviceWorker.handleMessage(updatePreferencesMessage, sender, sendResponse1),
        serviceWorker.handleMessage(saveHistoryMessage, sender, sendResponse2)
      ]);

      expect(sendResponse1).toHaveBeenCalledWith({ success: true });
      expect(sendResponse2).toHaveBeenCalledWith({ success: true });
      expect(mockChrome.storage.local.set).toHaveBeenCalledTimes(2);
    });

    it('should handle storage errors gracefully', async () => {
      // RED: This test should fail because storage error handling doesn't exist
      mockChrome.storage.local.set.mockRejectedValue(new Error('Storage quota exceeded'));

      const message = {
        action: 'updatePreferences',
        preferences: createDefaultUserPreferences()
      };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to save preferences: Failed to save preferences: Storage quota exceeded'
      });
    });

    it('should provide storage statistics to components', async () => {
      // RED: This test should fail because storage statistics don't exist
      mockChrome.storage.local.getBytesInUse.mockResolvedValue(2048);
      mockChrome.storage.local.get.mockImplementation((key) => {
        if (key === 'locateflow_history') {
          return Promise.resolve({
            locateflow_history: [
              {
                id: '1',
                timestamp: Date.now(),
                url: 'test.com',
                elementInfo: {
                  tagName: 'div',
                  textContent: 'Test 1',
                  attributes: {},
                  position: createElementPosition(0, 0, 100, 50),
                  xpath: '//div[1]'
                },
                strategies: []
              },
              {
                id: '2',
                timestamp: Date.now(),
                url: 'test.com',
                elementInfo: {
                  tagName: 'div',
                  textContent: 'Test 2',
                  attributes: {},
                  position: createElementPosition(0, 0, 100, 50),
                  xpath: '//div[2]'
                },
                strategies: []
              }
            ]
          });
        }
        return Promise.resolve({});
      });

      const message = { action: 'getStorageStats' };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        stats: {
          totalUsage: 2048,
          historyCount: 2,
          isNearLimit: false,
          needsCleanup: false
        }
      });
    });

    it('should trigger storage cleanup when needed', async () => {
      // RED: This test should fail because storage cleanup triggering doesn't exist
      mockChrome.storage.local.getBytesInUse.mockResolvedValue(3.6 * 1024 * 1024); // Above cleanup threshold

      const message = { action: 'getStorageStats' };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        stats: {
          totalUsage: 3.6 * 1024 * 1024,
          historyCount: 0,
          isNearLimit: true,
          needsCleanup: true
        }
      });
    });
  });

  describe('Cross-Component Communication', () => {
    it('should notify content scripts of preference changes', async () => {
      // RED: This test should fail because content script notification doesn't exist
      const preferences = createDefaultUserPreferences();
      preferences.highlightColor = '#00ff00';

      mockChrome.tabs.query.mockResolvedValue([{ id: 123 }]);

      const message = {
        action: 'updatePreferences',
        preferences
      };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: 'preferencesUpdated',
        preferences
      });
    });

    it('should handle storage operations from multiple tabs', async () => {
      // RED: This test should fail because multi-tab coordination doesn't exist
      const locatorData1: LocatorData = {
        id: 'tab1-data',
        timestamp: Date.now(),
        url: 'https://tab1.com',
        elementInfo: {
          tagName: 'button',
          textContent: 'Tab 1 Button',
          attributes: { id: 'tab1-btn' },
          position: createElementPosition(100, 200, 80, 30),
          xpath: '//button[@id="tab1-btn"]'
        },
        strategies: []
      };

      const locatorData2: LocatorData = {
        id: 'tab2-data',
        timestamp: Date.now() + 1000,
        url: 'https://tab2.com',
        elementInfo: {
          tagName: 'input',
          textContent: '',
          attributes: { type: 'text', name: 'tab2-input' },
          position: createElementPosition(50, 100, 200, 40),
          xpath: '//input[@name="tab2-input"]'
        },
        strategies: []
      };

      mockChrome.storage.local.get.mockImplementation((key) => {
        if (key === 'locateflow_preferences') {
          return Promise.resolve({ locateflow_preferences: createDefaultUserPreferences() });
        }
        if (key === 'locateflow_history') {
          return Promise.resolve({ locateflow_history: [] });
        }
        return Promise.resolve({});
      });

      const message1 = { action: 'saveToHistory', locatorData: locatorData1 };
      const message2 = { action: 'saveToHistory', locatorData: locatorData2 };
      const sender1 = { tab: { id: 123 } as chrome.tabs.Tab };
      const sender2 = { tab: { id: 456 } as chrome.tabs.Tab };
      const sendResponse1 = jest.fn();
      const sendResponse2 = jest.fn();

      await serviceWorker.handleMessage(message1, sender1, sendResponse1);
      await serviceWorker.handleMessage(message2, sender2, sendResponse2);

      expect(sendResponse1).toHaveBeenCalledWith({ success: true });
      expect(sendResponse2).toHaveBeenCalledWith({ success: true });
      expect(mockChrome.storage.local.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle corrupted storage data gracefully', async () => {
      // RED: This test should fail because corrupted data handling doesn't exist
      mockChrome.storage.local.get.mockResolvedValue({
        locateflow_preferences: 'invalid-json-string',
        locateflow_history: null
      });

      const message = { action: 'getPreferences' };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      // Should return default preferences when stored data is corrupted
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        preferences: createDefaultUserPreferences()
      });
    });

    it('should recover from storage access failures', async () => {
      // RED: This test should fail because storage failure recovery doesn't exist
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage access denied'));

      const message = { action: 'getHistory' };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      // StorageManager.loadHistory() returns empty array on error, so service should succeed
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        history: []
      });
    });

    it('should log storage coordination errors for debugging', async () => {
      // RED: This test should fail because error logging doesn't exist
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockChrome.storage.local.set.mockRejectedValue(new Error('Storage write failed'));

      const message = {
        action: 'updatePreferences',
        preferences: createDefaultUserPreferences()
      };
      const sender = { tab: { id: 123 } as chrome.tabs.Tab };
      const sendResponse = jest.fn();

      await serviceWorker.handleMessage(message, sender, sendResponse);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ServiceWorker] Storage coordination failed:'),
        expect.any(Error),
        expect.objectContaining({ action: 'updatePreferences' })
      );

      consoleSpy.mockRestore();
    });
  });
});