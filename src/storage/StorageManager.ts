/**
 * @fileoverview StorageManager - Chrome storage wrapper for LocateFlow extension
 * 
 * Provides CRUD operations for user preferences and history data with
 * quota management and data cleanup functionality.
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import {
  UserPreferences,
  LocatorData,
  createDefaultUserPreferences,
  validateUserPreferences,
  validateLocatorData
} from '../shared/data-models';

/**
 * Storage keys used in Chrome storage
 */
const STORAGE_KEYS = {
  PREFERENCES: 'locateflow_preferences',
  HISTORY: 'locateflow_history'
} as const;

/**
 * Storage quota limits (in bytes)
 */
const STORAGE_LIMITS = {
  MAX_STORAGE_SIZE: 4 * 1024 * 1024, // 4MB (Chrome local storage limit is ~5MB)
  CLEANUP_THRESHOLD: 3.5 * 1024 * 1024, // 3.5MB - trigger cleanup
  MIN_HISTORY_ENTRIES: 10 // Always keep at least 10 entries
} as const;

/**
 * Chrome storage wrapper providing CRUD operations for preferences and history
 */
export class StorageManager {
  /**
     * Generate a unique ID for history entries
     * @returns Unique string ID with timestamp and random component
     */
  private generateHistoryId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
     * Create a history entry from locator data with unique ID and current timestamp
     * @param locatorData - Original locator data
     * @returns New history entry with unique ID and current timestamp
     */
  private createHistoryEntry(locatorData: LocatorData): LocatorData {
    return {
      id: this.generateHistoryId(),
      timestamp: Date.now(),
      url: locatorData.url,
      elementInfo: locatorData.elementInfo,
      strategies: locatorData.strategies
    };
  }
  /**
     * Save user preferences to Chrome storage
     * @param preferences - User preferences to save
     * @throws Error if preferences are invalid or storage operation fails
     */
  async savePreferences(preferences: UserPreferences): Promise<void> {
    if (!validateUserPreferences(preferences)) {
      throw new Error('Invalid user preferences data');
    }

    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.PREFERENCES]: preferences
      });
    } catch (error) {
      throw new Error(`Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
     * Load user preferences from Chrome storage
     * @returns User preferences or defaults if none exist
     */
  async loadPreferences(): Promise<UserPreferences> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.PREFERENCES);
      const storedPreferences = result[STORAGE_KEYS.PREFERENCES];

      if (storedPreferences && validateUserPreferences(storedPreferences)) {
        return storedPreferences;
      }

      // Return defaults if no valid preferences found
      return createDefaultUserPreferences();
    } catch (error) {
      // Return defaults on any error
      return createDefaultUserPreferences();
    }
  }

  /**
     * Save locator data to history with automatic cleanup
     * @param locatorData - Locator data to save
     * @throws Error if data is invalid or storage operation fails
     */
  async saveToHistory(locatorData: LocatorData): Promise<void> {
    if (!validateLocatorData(locatorData)) {
      throw new Error('Invalid locator data');
    }

    try {
      // Load current preferences to get history limit
      const preferences = await this.loadPreferences();

      // Load existing history
      const currentHistory = await this.loadHistory();

      // Add new entry at the beginning (most recent first)
      const updatedHistory = [locatorData, ...currentHistory];

      // Enforce history limit
      const limitedHistory = updatedHistory.slice(0, preferences.historyLimit);

      await chrome.storage.local.set({
        [STORAGE_KEYS.HISTORY]: limitedHistory
      });
    } catch (error) {
      throw new Error(`Failed to save to history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
     * Load history from Chrome storage
     * @returns Array of locator data entries
     */
  async loadHistory(): Promise<LocatorData[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
      const storedHistory = result[STORAGE_KEYS.HISTORY];

      if (Array.isArray(storedHistory)) {
        // Validate each entry and filter out invalid ones
        return storedHistory.filter(validateLocatorData);
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
     * Get current storage usage in bytes
     * @returns Storage usage in bytes
     */
  async getStorageUsage(): Promise<number> {
    try {
      return await chrome.storage.local.getBytesInUse(null);
    } catch (error) {
      throw new Error(`Failed to get storage usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
     * Clean up storage by removing old history entries
     * Triggered when storage usage exceeds threshold
     */
  async cleanupStorage(): Promise<void> {
    try {
      const currentUsage = await this.getStorageUsage();

      if (currentUsage < STORAGE_LIMITS.CLEANUP_THRESHOLD) {
        return; // No cleanup needed
      }

      const history = await this.loadHistory();

      if (history.length <= STORAGE_LIMITS.MIN_HISTORY_ENTRIES) {
        return; // Don't clean up if we have too few entries
      }

      // Keep only the most recent entries (reduce by 50% or to minimum, whichever is larger)
      const targetSize = Math.max(
        Math.floor(history.length * 0.5),
        STORAGE_LIMITS.MIN_HISTORY_ENTRIES
      );

      const cleanedHistory = history
        .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp descending
        .slice(0, targetSize);

      await chrome.storage.local.set({
        [STORAGE_KEYS.HISTORY]: cleanedHistory
      });
    } catch (error) {
      throw new Error(`Failed to cleanup storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
     * Clear all storage data
     */
  async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      throw new Error(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
     * Remove specific entries from history by IDs
     * @param ids - Array of locator data IDs to remove
     */
  async removeFromHistory(ids: string[]): Promise<void> {
    try {
      const history = await this.loadHistory();
      const filteredHistory = history.filter(entry => !ids.includes(entry.id));

      await chrome.storage.local.set({
        [STORAGE_KEYS.HISTORY]: filteredHistory
      });
    } catch (error) {
      throw new Error(`Failed to remove from history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
     * Get storage statistics
     * @returns Object containing storage usage statistics
     */
  async getStorageStats(): Promise<{
    totalUsage: number;
    historyCount: number;
    isNearLimit: boolean;
    needsCleanup: boolean;
  }> {
    try {
      const [usage, history] = await Promise.all([
        this.getStorageUsage(),
        this.loadHistory()
      ]);

      return {
        totalUsage: usage,
        historyCount: history.length,
        // Logical progression: isNearLimit (80% = 3.2MB) comes before needsCleanup (3.5MB)
        isNearLimit: usage > STORAGE_LIMITS.MAX_STORAGE_SIZE * 0.8, // 3.2MB - warning threshold
        needsCleanup: usage > STORAGE_LIMITS.CLEANUP_THRESHOLD // 3.5MB - cleanup threshold
      };
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
     * Add locator data to history when copied (automatic history entry creation)
     * Creates a new history entry with unique ID and current timestamp
     * Implements oldest-first removal when history exceeds capacity
     * @param locatorData - Original locator data to create history entry from
     * @throws Error if data is invalid or storage operation fails
     */
  async addToHistoryOnCopy(locatorData: LocatorData): Promise<void> {
    if (!validateLocatorData(locatorData)) {
      throw new Error('Invalid locator data for history entry');
    }

    try {
      // Load current preferences to get history limit
      const preferences = await this.loadPreferences();

      // Load existing history
      const currentHistory = await this.loadHistory();

      // Create new history entry with unique ID and current timestamp
      const historyEntry = this.createHistoryEntry(locatorData);

      // Add new entry at the beginning (most recent first)
      const updatedHistory = [historyEntry, ...currentHistory];

      // Enforce history limit with oldest-first removal
      const limitedHistory = updatedHistory.slice(0, preferences.historyLimit);

      await chrome.storage.local.set({
        [STORAGE_KEYS.HISTORY]: limitedHistory
      });
    } catch (error) {
      throw new Error(`Failed to add to history on copy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
     * Clear all history entries
     * @throws Error if storage operation fails
     */
  async clearHistory(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.HISTORY]: []
      });
    } catch (error) {
      throw new Error(`Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}