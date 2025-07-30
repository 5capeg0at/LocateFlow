/**
 * @fileoverview Tests for StorageManager - Chrome storage wrapper
 * 
 * Following TDD methodology with Red-Green-Refactor cycle.
 * Tests cover CRUD operations, quota management, and data cleanup.
 */

import { StorageManager } from '../../src/storage/StorageManager';
import { UserPreferences, LocatorData, createDefaultUserPreferences } from '../../src/shared/data-models';

// Mock Chrome storage API
const mockChromeStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    remove: jest.fn(),
    getBytesInUse: jest.fn()
  }
};

// Setup Chrome API mock
beforeEach(() => {
  global.chrome = {
    storage: mockChromeStorage
  } as any;

  jest.clearAllMocks();
});

describe('StorageManager', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager();
  });

  describe('User Preferences Management', () => {
    it('should save user preferences to Chrome storage', async () => {
      // Arrange
      const preferences: UserPreferences = createDefaultUserPreferences();
      mockChromeStorage.local.set.mockResolvedValue(undefined);

      // Act
      await storageManager.savePreferences(preferences);

      // Assert
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        'locateflow_preferences': preferences
      });
    });

    it('should load user preferences from Chrome storage', async () => {
      // Arrange
      const expectedPreferences = createDefaultUserPreferences();
      mockChromeStorage.local.get.mockResolvedValue({
        'locateflow_preferences': expectedPreferences
      });

      // Act
      const result = await storageManager.loadPreferences();

      // Assert
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith('locateflow_preferences');
      expect(result).toEqual(expectedPreferences);
    });

    it('should return default preferences when none exist in storage', async () => {
      // Arrange
      mockChromeStorage.local.get.mockResolvedValue({});

      // Act
      const result = await storageManager.loadPreferences();

      // Assert
      expect(result).toEqual(createDefaultUserPreferences());
    });

    it('should throw error when saving invalid preferences', async () => {
      // Arrange
      const invalidPreferences = { invalid: 'data' } as any;

      // Act & Assert
      await expect(storageManager.savePreferences(invalidPreferences))
        .rejects.toThrow('Invalid user preferences data');
    });
  });

  describe('History Management', () => {
    it('should save locator data to history', async () => {
      // Arrange
      const locatorData: LocatorData = {
        id: 'test-id',
        timestamp: Date.now(),
        url: 'https://example.com',
        elementInfo: {
          tagName: 'button',
          textContent: 'Click me',
          attributes: { id: 'test-btn' },
          position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
          xpath: '//button[@id="test-btn"]'
        },
        strategies: []
      };

      mockChromeStorage.local.get.mockResolvedValue({ 'locateflow_history': [] });
      mockChromeStorage.local.set.mockResolvedValue(undefined);

      // Act
      await storageManager.saveToHistory(locatorData);

      // Assert
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        'locateflow_history': [locatorData]
      });
    });

    it('should load history from Chrome storage', async () => {
      // Arrange
      const expectedHistory: LocatorData[] = [{
        id: 'test-id',
        timestamp: Date.now(),
        url: 'https://example.com',
        elementInfo: {
          tagName: 'div',
          textContent: 'Test',
          attributes: {},
          position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
          xpath: '//div'
        },
        strategies: []
      }];

      mockChromeStorage.local.get.mockResolvedValue({
        'locateflow_history': expectedHistory
      });

      // Act
      const result = await storageManager.loadHistory();

      // Assert
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith('locateflow_history');
      expect(result).toEqual(expectedHistory);
    });

    it('should return empty array when no history exists', async () => {
      // Arrange
      mockChromeStorage.local.get.mockResolvedValue({});

      // Act
      const result = await storageManager.loadHistory();

      // Assert
      expect(result).toEqual([]);
    });

    it('should enforce history limit when saving new entries', async () => {
      // Arrange
      const preferences = { ...createDefaultUserPreferences(), historyLimit: 2 };
      const createValidElementInfo = () => ({
        tagName: 'div',
        textContent: 'test',
        attributes: {},
        position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
        xpath: '//div'
      });

      const existingHistory: LocatorData[] = [
        { id: '1', timestamp: 1, url: 'url1', elementInfo: createValidElementInfo(), strategies: [] },
        { id: '2', timestamp: 2, url: 'url2', elementInfo: createValidElementInfo(), strategies: [] }
      ];
      const newEntry: LocatorData = {
        id: '3', timestamp: 3, url: 'url3', elementInfo: createValidElementInfo(), strategies: []
      };

      mockChromeStorage.local.get
        .mockResolvedValueOnce({ 'locateflow_preferences': preferences })
        .mockResolvedValueOnce({ 'locateflow_history': existingHistory });
      mockChromeStorage.local.set.mockResolvedValue(undefined);

      // Act
      await storageManager.saveToHistory(newEntry);

      // Assert
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        'locateflow_history': [newEntry, { id: '1', timestamp: 1, url: 'url1', elementInfo: createValidElementInfo(), strategies: [] }]
      });
    });
  });

  describe('Storage Quota Management', () => {
    it('should check storage usage', async () => {
      // Arrange
      mockChromeStorage.local.getBytesInUse.mockResolvedValue(1024);

      // Act
      const usage = await storageManager.getStorageUsage();

      // Assert
      expect(mockChromeStorage.local.getBytesInUse).toHaveBeenCalledWith(null);
      expect(usage).toBe(1024);
    });

    it('should trigger cleanup when storage quota is exceeded', async () => {
      // Arrange
      const createValidElementInfo = () => ({
        tagName: 'div',
        textContent: 'test',
        attributes: {},
        position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
        xpath: '//div'
      });

      const largeHistory = Array.from({ length: 200 }, (_, i) => ({
        id: `id-${i}`,
        timestamp: i,
        url: `url-${i}`,
        elementInfo: createValidElementInfo(),
        strategies: []
      }));

      mockChromeStorage.local.getBytesInUse.mockResolvedValue(5000000); // 5MB
      mockChromeStorage.local.get.mockResolvedValue({
        'locateflow_history': largeHistory,
        'locateflow_preferences': createDefaultUserPreferences()
      });
      mockChromeStorage.local.set.mockResolvedValue(undefined);

      // Act
      await storageManager.cleanupStorage();

      // Assert - Should keep only the most recent entries
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        'locateflow_history': expect.arrayContaining([
          expect.objectContaining({ id: 'id-199' })
        ])
      });
    });

    it('should clear all storage data', async () => {
      // Arrange
      mockChromeStorage.local.clear.mockResolvedValue(undefined);

      // Act
      await storageManager.clearAllData();

      // Assert
      expect(mockChromeStorage.local.clear).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Chrome storage errors gracefully', async () => {
      // Arrange
      const storageError = new Error('Storage quota exceeded');
      mockChromeStorage.local.set.mockRejectedValue(storageError);

      // Act & Assert
      await expect(storageManager.savePreferences(createDefaultUserPreferences()))
        .rejects.toThrow('Failed to save preferences: Storage quota exceeded');
    });

    it('should handle corrupted data in storage', async () => {
      // Arrange
      mockChromeStorage.local.get.mockResolvedValue({
        'locateflow_preferences': 'invalid-json-data'
      });

      // Act
      const result = await storageManager.loadPreferences();

      // Assert - Should return defaults when data is corrupted
      expect(result).toEqual(createDefaultUserPreferences());
    });
  });

  describe('Additional Storage Operations', () => {
    it('should remove specific entries from history', async () => {
      // Arrange
      const createValidElementInfo = () => ({
        tagName: 'div',
        textContent: 'test',
        attributes: {},
        position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
        xpath: '//div'
      });

      const history: LocatorData[] = [
        { id: '1', timestamp: 1, url: 'url1', elementInfo: createValidElementInfo(), strategies: [] },
        { id: '2', timestamp: 2, url: 'url2', elementInfo: createValidElementInfo(), strategies: [] },
        { id: '3', timestamp: 3, url: 'url3', elementInfo: createValidElementInfo(), strategies: [] }
      ];

      mockChromeStorage.local.get.mockResolvedValue({ 'locateflow_history': history });
      mockChromeStorage.local.set.mockResolvedValue(undefined);

      // Act
      await storageManager.removeFromHistory(['1', '3']);

      // Assert
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        'locateflow_history': [{ id: '2', timestamp: 2, url: 'url2', elementInfo: createValidElementInfo(), strategies: [] }]
      });
    });

    it('should get storage statistics', async () => {
      // Arrange
      const createValidElementInfo = () => ({
        tagName: 'div',
        textContent: 'test',
        attributes: {},
        position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
        xpath: '//div'
      });

      const history: LocatorData[] = [
        { id: '1', timestamp: 1, url: 'url1', elementInfo: createValidElementInfo(), strategies: [] }
      ];

      mockChromeStorage.local.getBytesInUse.mockResolvedValue(2048);
      mockChromeStorage.local.get.mockResolvedValue({ 'locateflow_history': history });

      // Act
      const stats = await storageManager.getStorageStats();

      // Assert
      expect(stats).toEqual({
        totalUsage: 2048,
        historyCount: 1,
        isNearLimit: false,
        needsCleanup: false
      });
    });

    it('should indicate when storage is near limit', async () => {
      // Arrange
      mockChromeStorage.local.getBytesInUse.mockResolvedValue(3700000); // 3.7MB (above 3.5MB threshold)
      mockChromeStorage.local.get.mockResolvedValue({ 'locateflow_history': [] });

      // Act
      const stats = await storageManager.getStorageStats();

      // Assert
      expect(stats.isNearLimit).toBe(true);
      expect(stats.needsCleanup).toBe(true); // 3.7MB > 80% of 4MB (3.355MB)
    });

    it('should indicate when cleanup is needed', async () => {
      // Arrange
      mockChromeStorage.local.getBytesInUse.mockResolvedValue(3400000); // 3.4MB (above 80% of 4MB = 3.2MB)
      mockChromeStorage.local.get.mockResolvedValue({ 'locateflow_history': [] });

      // Act
      const stats = await storageManager.getStorageStats();

      // Assert
      expect(stats.isNearLimit).toBe(true); // Should be near limit at 3.4MB (> 3.2MB)
      expect(stats.needsCleanup).toBe(false); // Should not need cleanup yet (< 3.5MB)
    });

    it('should indicate when both near limit and cleanup needed', async () => {
      // Arrange
      mockChromeStorage.local.getBytesInUse.mockResolvedValue(3700000); // 3.7MB (above 3.5MB cleanup threshold)
      mockChromeStorage.local.get.mockResolvedValue({ 'locateflow_history': [] });

      // Act
      const stats = await storageManager.getStorageStats();

      // Assert
      expect(stats.isNearLimit).toBe(true); // Near limit (> 3.2MB)
      expect(stats.needsCleanup).toBe(true); // Needs cleanup (> 3.5MB)
    });
  });

  describe('Locator History Management (Task 3.2)', () => {
    describe('Automatic History Entry Creation', () => {
      it('should automatically create history entry when locator is copied', async () => {
        // Arrange
        const locatorData: LocatorData = {
          id: 'auto-generated-id',
          timestamp: Date.now(),
          url: 'https://example.com',
          elementInfo: {
            tagName: 'button',
            textContent: 'Submit',
            attributes: { id: 'submit-btn', class: 'btn primary' },
            position: { x: 100, y: 200, width: 120, height: 40, top: 200, left: 100, bottom: 240, right: 220 },
            xpath: '//button[@id="submit-btn"]'
          },
          strategies: [
            {
              type: 'css',
              selector: '#submit-btn',
              confidence: { score: 95, factors: [], warnings: [] },
              explanation: 'ID selector with high confidence',
              isUnique: true,
              isStable: true
            }
          ]
        };

        mockChromeStorage.local.get
          .mockResolvedValueOnce({ 'locateflow_preferences': createDefaultUserPreferences() })
          .mockResolvedValueOnce({ 'locateflow_history': [] });
        mockChromeStorage.local.set.mockResolvedValue(undefined);

        // Act
        await storageManager.addToHistoryOnCopy(locatorData);

        // Assert
        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          'locateflow_history': [expect.objectContaining({
            id: expect.any(String),
            timestamp: expect.any(Number),
            url: 'https://example.com',
            elementInfo: locatorData.elementInfo,
            strategies: locatorData.strategies
          })]
        });
      });

      it('should generate unique ID and timestamp for history entry', async () => {
        // Arrange
        const locatorData: LocatorData = {
          id: 'original-id',
          timestamp: 12345,
          url: 'https://example.com',
          elementInfo: {
            tagName: 'div',
            textContent: 'Content',
            attributes: {},
            position: { x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, bottom: 50, right: 100 },
            xpath: '//div'
          },
          strategies: []
        };

        mockChromeStorage.local.get
          .mockResolvedValueOnce({ 'locateflow_preferences': createDefaultUserPreferences() })
          .mockResolvedValueOnce({ 'locateflow_history': [] });
        mockChromeStorage.local.set.mockResolvedValue(undefined);

        // Act
        await storageManager.addToHistoryOnCopy(locatorData);

        // Assert
        const savedData = mockChromeStorage.local.set.mock.calls[0][0]['locateflow_history'][0];
        expect(savedData.id).not.toBe('original-id');
        expect(savedData.timestamp).not.toBe(12345);
        expect(savedData.timestamp).toBeGreaterThan(Date.now() - 1000); // Within last second
      });

      it('should preserve element info and strategies when creating history entry', async () => {
        // Arrange
        const locatorData: LocatorData = {
          id: 'test-id',
          timestamp: Date.now(),
          url: 'https://test.com',
          elementInfo: {
            tagName: 'input',
            textContent: '',
            attributes: { type: 'email', name: 'email', placeholder: 'Enter email' },
            position: { x: 50, y: 100, width: 200, height: 30, top: 100, left: 50, bottom: 130, right: 250 },
            xpath: '//input[@name="email"]'
          },
          strategies: [
            {
              type: 'css',
              selector: 'input[name="email"]',
              confidence: { score: 90, factors: [], warnings: [] },
              explanation: 'Name attribute selector',
              isUnique: true,
              isStable: true
            },
            {
              type: 'xpath',
              selector: '//input[@name="email"]',
              confidence: { score: 85, factors: [], warnings: [] },
              explanation: 'XPath with name attribute',
              isUnique: true,
              isStable: true
            }
          ]
        };

        mockChromeStorage.local.get
          .mockResolvedValueOnce({ 'locateflow_preferences': createDefaultUserPreferences() })
          .mockResolvedValueOnce({ 'locateflow_history': [] });
        mockChromeStorage.local.set.mockResolvedValue(undefined);

        // Act
        await storageManager.addToHistoryOnCopy(locatorData);

        // Assert
        const savedData = mockChromeStorage.local.set.mock.calls[0][0]['locateflow_history'][0];
        expect(savedData.elementInfo).toEqual(locatorData.elementInfo);
        expect(savedData.strategies).toEqual(locatorData.strategies);
        expect(savedData.url).toBe(locatorData.url);
      });
    });

    describe('History Capacity Management with Oldest-First Removal', () => {
      it('should remove oldest entries when history exceeds capacity', async () => {
        // Arrange
        const preferences = { ...createDefaultUserPreferences(), historyLimit: 3 };
        const createValidElementInfo = (id: string) => ({
          tagName: 'div',
          textContent: `Content ${id}`,
          attributes: { id },
          position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
          xpath: `//div[@id="${id}"]`
        });

        // Create existing history with 3 entries (at capacity)
        const existingHistory: LocatorData[] = [
          { id: 'newest', timestamp: 3, url: 'url3', elementInfo: createValidElementInfo('newest'), strategies: [] },
          { id: 'middle', timestamp: 2, url: 'url2', elementInfo: createValidElementInfo('middle'), strategies: [] },
          { id: 'oldest', timestamp: 1, url: 'url1', elementInfo: createValidElementInfo('oldest'), strategies: [] }
        ];

        const newEntry: LocatorData = {
          id: 'new-entry',
          timestamp: 4,
          url: 'url4',
          elementInfo: createValidElementInfo('new-entry'),
          strategies: []
        };

        mockChromeStorage.local.get
          .mockResolvedValueOnce({ 'locateflow_preferences': preferences })
          .mockResolvedValueOnce({ 'locateflow_history': existingHistory });
        mockChromeStorage.local.set.mockResolvedValue(undefined);

        // Act
        await storageManager.addToHistoryOnCopy(newEntry);

        // Assert - Should keep newest 3 entries, removing the oldest
        const savedHistory = mockChromeStorage.local.set.mock.calls[0][0]['locateflow_history'];
        expect(savedHistory).toHaveLength(3);

        // Check that new entry is first (newest)
        expect(savedHistory[0].url).toBe('url4');
        expect(savedHistory[0].elementInfo.attributes.id).toBe('new-entry');

        // Check that oldest entries are preserved in correct order
        expect(savedHistory[1].url).toBe('url3'); // Previously newest
        expect(savedHistory[2].url).toBe('url2'); // Previously middle

        // Check that oldest entry was removed
        expect(savedHistory.map((entry: LocatorData) => entry.url)).not.toContain('url1');
      });

      it('should maintain chronological order with newest first after capacity management', async () => {
        // Arrange
        const preferences = { ...createDefaultUserPreferences(), historyLimit: 2 };
        const createValidElementInfo = (id: string) => ({
          tagName: 'span',
          textContent: `Text ${id}`,
          attributes: { class: id },
          position: { x: 0, y: 0, width: 80, height: 20, top: 0, left: 0, bottom: 20, right: 80 },
          xpath: `//span[@class="${id}"]`
        });

        const existingHistory: LocatorData[] = [
          { id: 'entry2', timestamp: 200, url: 'url2', elementInfo: createValidElementInfo('entry2'), strategies: [] },
          { id: 'entry1', timestamp: 100, url: 'url1', elementInfo: createValidElementInfo('entry1'), strategies: [] }
        ];

        const newEntry: LocatorData = {
          id: 'entry3',
          timestamp: 300,
          url: 'url3',
          elementInfo: createValidElementInfo('entry3'),
          strategies: []
        };

        mockChromeStorage.local.get
          .mockResolvedValueOnce({ 'locateflow_preferences': preferences })
          .mockResolvedValueOnce({ 'locateflow_history': existingHistory });
        mockChromeStorage.local.set.mockResolvedValue(undefined);

        // Act
        await storageManager.addToHistoryOnCopy(newEntry);

        // Assert - Should maintain newest-first order
        const savedHistory = mockChromeStorage.local.set.mock.calls[0][0]['locateflow_history'];
        expect(savedHistory).toHaveLength(2);

        // Check that new entry is first (newest) - verify by URL since ID is auto-generated
        expect(savedHistory[0].url).toBe('url3');
        expect(savedHistory[0].elementInfo.attributes.class).toBe('entry3');

        // Check that second newest is preserved
        expect(savedHistory[1].url).toBe('url2');
        expect(savedHistory[1].elementInfo.attributes.class).toBe('entry2');

        // Check timestamps are in descending order (newest first)
        expect(savedHistory[0].timestamp).toBeGreaterThan(savedHistory[1].timestamp);
      });

      it('should handle empty history when adding first entry', async () => {
        // Arrange
        const newEntry: LocatorData = {
          id: 'first-entry',
          timestamp: Date.now(),
          url: 'https://first.com',
          elementInfo: {
            tagName: 'h1',
            textContent: 'Welcome',
            attributes: { class: 'title' },
            position: { x: 0, y: 0, width: 300, height: 60, top: 0, left: 0, bottom: 60, right: 300 },
            xpath: '//h1[@class="title"]'
          },
          strategies: []
        };

        mockChromeStorage.local.get
          .mockResolvedValueOnce({ 'locateflow_preferences': createDefaultUserPreferences() })
          .mockResolvedValueOnce({ 'locateflow_history': [] });
        mockChromeStorage.local.set.mockResolvedValue(undefined);

        // Act
        await storageManager.addToHistoryOnCopy(newEntry);

        // Assert
        const savedHistory = mockChromeStorage.local.set.mock.calls[0][0]['locateflow_history'];
        expect(savedHistory).toHaveLength(1);
        expect(savedHistory[0]).toMatchObject({
          url: 'https://first.com',
          elementInfo: newEntry.elementInfo,
          strategies: newEntry.strategies
        });
      });

      it('should respect different history limits from user preferences', async () => {
        // Arrange
        const preferences = { ...createDefaultUserPreferences(), historyLimit: 5 };
        const createValidElementInfo = (id: string) => ({
          tagName: 'button',
          textContent: `Button ${id}`,
          attributes: { id: `btn-${id}` },
          position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
          xpath: `//button[@id="btn-${id}"]`
        });

        // Create history with 5 entries (at capacity) - newest first as stored by saveToHistory
        const existingHistory: LocatorData[] = Array.from({ length: 5 }, (_, i) => ({
          id: `entry-${4 - i}`, // Reverse order: entry-4, entry-3, entry-2, entry-1, entry-0
          timestamp: 5 - i,   // Timestamps: 5, 4, 3, 2, 1 (newest first)
          url: `url-${4 - i}`,  // URLs: url-4, url-3, url-2, url-1, url-0
          elementInfo: createValidElementInfo(`${4 - i}`),
          strategies: []
        }));

        const newEntry: LocatorData = {
          id: 'new-entry',
          timestamp: 6,
          url: 'new-url',
          elementInfo: createValidElementInfo('new'),
          strategies: []
        };

        mockChromeStorage.local.get
          .mockResolvedValueOnce({ 'locateflow_preferences': preferences })
          .mockResolvedValueOnce({ 'locateflow_history': existingHistory });
        mockChromeStorage.local.set.mockResolvedValue(undefined);

        // Act
        await storageManager.addToHistoryOnCopy(newEntry);

        // Assert - Should maintain limit of 5
        const savedHistory = mockChromeStorage.local.set.mock.calls[0][0]['locateflow_history'];
        expect(savedHistory).toHaveLength(5);

        // Check that new entry is first (newest)
        expect(savedHistory[0].url).toBe('new-url');
        expect(savedHistory[0].elementInfo.attributes.id).toBe('btn-new');

        // Check that oldest entry was removed (entry-0 should be gone)
        const preservedUrls = savedHistory.map((entry: LocatorData) => entry.url);
        expect(preservedUrls).toContain('url-4'); // Most recent existing entry
        expect(preservedUrls).toContain('url-3');
        expect(preservedUrls).toContain('url-2');
        expect(preservedUrls).toContain('url-1');
        expect(preservedUrls).not.toContain('url-0'); // Oldest should be removed
      });
    });

    describe('Error Handling for History Management', () => {
      it('should handle errors when adding to history on copy', async () => {
        // Arrange
        const locatorData: LocatorData = {
          id: 'test-id',
          timestamp: Date.now(),
          url: 'https://example.com',
          elementInfo: {
            tagName: 'div',
            textContent: 'Test',
            attributes: {},
            position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
            xpath: '//div'
          },
          strategies: []
        };

        mockChromeStorage.local.get
          .mockResolvedValueOnce({ 'locateflow_preferences': createDefaultUserPreferences() })
          .mockResolvedValueOnce({ 'locateflow_history': [] });
        mockChromeStorage.local.set.mockRejectedValue(new Error('Storage full'));

        // Act & Assert
        await expect(storageManager.addToHistoryOnCopy(locatorData))
          .rejects.toThrow('Failed to add to history on copy: Storage full');
      });

      it('should handle invalid locator data when adding to history on copy', async () => {
        // Arrange
        const invalidLocatorData = { invalid: 'data' } as any;

        // Act & Assert
        await expect(storageManager.addToHistoryOnCopy(invalidLocatorData))
          .rejects.toThrow('Invalid locator data for history entry');
      });
    });
  });

  describe('Additional Error Handling', () => {
    it('should handle errors when saving to history', async () => {
      // Arrange
      const validLocatorData: LocatorData = {
        id: 'test-id',
        timestamp: Date.now(),
        url: 'https://example.com',
        elementInfo: {
          tagName: 'button',
          textContent: 'Click me',
          attributes: { id: 'test-btn' },
          position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
          xpath: '//button[@id="test-btn"]'
        },
        strategies: []
      };

      mockChromeStorage.local.get
        .mockResolvedValueOnce({ 'locateflow_preferences': createDefaultUserPreferences() })
        .mockResolvedValueOnce({ 'locateflow_history': [] });
      mockChromeStorage.local.set.mockRejectedValue(new Error('Storage error'));

      // Act & Assert
      await expect(storageManager.saveToHistory(validLocatorData))
        .rejects.toThrow('Failed to save to history: Storage error');
    });

    it('should handle errors when getting storage usage', async () => {
      // Arrange
      mockChromeStorage.local.getBytesInUse.mockRejectedValue(new Error('Access denied'));

      // Act & Assert
      await expect(storageManager.getStorageUsage())
        .rejects.toThrow('Failed to get storage usage: Access denied');
    });

    it('should handle errors when cleaning up storage', async () => {
      // Arrange
      mockChromeStorage.local.getBytesInUse.mockRejectedValue(new Error('Storage error'));

      // Act & Assert
      await expect(storageManager.cleanupStorage())
        .rejects.toThrow('Failed to cleanup storage: Failed to get storage usage: Storage error');
    });

    it('should handle errors when removing from history', async () => {
      // Arrange
      mockChromeStorage.local.get.mockResolvedValue({ 'locateflow_history': [] });
      mockChromeStorage.local.set.mockRejectedValue(new Error('Storage error'));

      // Act & Assert
      await expect(storageManager.removeFromHistory(['id1']))
        .rejects.toThrow('Failed to remove from history: Storage error');
    });

    it('should handle errors when getting storage stats', async () => {
      // Arrange
      mockChromeStorage.local.getBytesInUse.mockRejectedValue(new Error('Access denied'));

      // Act & Assert
      await expect(storageManager.getStorageStats())
        .rejects.toThrow('Failed to get storage stats: Failed to get storage usage: Access denied');
    });

    it('should handle errors when clearing all data', async () => {
      // Arrange
      mockChromeStorage.local.clear.mockRejectedValue(new Error('Clear failed'));

      // Act & Assert
      await expect(storageManager.clearAllData())
        .rejects.toThrow('Failed to clear storage: Clear failed');
    });
  });

  describe('Edge Cases', () => {
    it('should skip cleanup when usage is below threshold', async () => {
      // Arrange
      mockChromeStorage.local.getBytesInUse.mockResolvedValue(1000000); // 1MB
      const setSpy = jest.spyOn(mockChromeStorage.local, 'set');

      // Act
      await storageManager.cleanupStorage();

      // Assert
      expect(setSpy).not.toHaveBeenCalled();
    });

    it('should skip cleanup when history has too few entries', async () => {
      // Arrange
      const createValidElementInfo = () => ({
        tagName: 'div',
        textContent: 'test',
        attributes: {},
        position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
        xpath: '//div'
      });

      const smallHistory = Array.from({ length: 5 }, (_, i) => ({
        id: `id-${i}`,
        timestamp: i,
        url: `url-${i}`,
        elementInfo: createValidElementInfo(),
        strategies: []
      }));

      mockChromeStorage.local.getBytesInUse.mockResolvedValue(4000000); // 4MB
      mockChromeStorage.local.get.mockResolvedValue({ 'locateflow_history': smallHistory });
      const setSpy = jest.spyOn(mockChromeStorage.local, 'set');

      // Act
      await storageManager.cleanupStorage();

      // Assert
      expect(setSpy).not.toHaveBeenCalled();
    });

    it('should filter out invalid history entries when loading', async () => {
      // Arrange
      const mixedHistory = [
        {
          id: 'valid',
          timestamp: Date.now(),
          url: 'https://example.com',
          elementInfo: {
            tagName: 'div',
            textContent: 'test',
            attributes: {},
            position: { x: 0, y: 0, width: 100, height: 30, top: 0, left: 0, bottom: 30, right: 100 },
            xpath: '//div'
          },
          strategies: []
        },
        { invalid: 'data' }, // Invalid entry
        null, // Invalid entry
        'string' // Invalid entry
      ];

      mockChromeStorage.local.get.mockResolvedValue({ 'locateflow_history': mixedHistory });

      // Act
      const result = await storageManager.loadHistory();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid');
    });
  });
});