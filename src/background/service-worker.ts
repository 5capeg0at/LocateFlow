/**
 * @fileoverview Service Worker for LocateFlow Chrome Extension
 * 
 * Manages extension lifecycle, cross-tab communication, and background processing
 * for the LocateFlow Chrome Extension. Implements Manifest V3 service worker
 * patterns for inspection mode management and UI state coordination.
 * 
 * Requirements implemented:
 * - 1.1: Extension inspection mode activation
 * - 5.2: Main extension popup display with controls and history
 * - 5.1: Automatic history saving when locators are copied
 * - 6.3: Persisting theme preferences across browser sessions using local storage
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import {
  UserPreferences,
  LocatorData,
  validateUserPreferences
} from '../shared/data-models';
import { StorageManager } from '../storage/StorageManager';


/**
 * Interface for Chrome extension message structure
 */
interface ExtensionMessage {
  action: string;
  tabId?: number;
  [key: string]: any;
}

/**
 * Type alias for Chrome message sender
 */
type MessageSender = chrome.runtime.MessageSender;

/**
 * Interface for error context information
 */
interface ErrorContext {
  tabId?: number;
  url?: string;
  [key: string]: any;
}

/**
 * Service Worker class for managing Chrome extension lifecycle and communication
 */
export class ServiceWorker {
  private inspectionStates: Map<number, boolean> = new Map();
  private storageManager: StorageManager;

  constructor() {
    // Service worker is constructed when needed
    this.storageManager = new StorageManager();
  }

  /**
     * Initializes the service worker by registering event listeners
     */
  initialize(): void {
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
  }

  /**
     * Handles extension installation
     */
  async handleInstalled(): Promise<void> {
    await chrome.action.setBadgeText({ text: '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#007acc' });
  }

  /**
     * Handles incoming messages from content scripts and popup
     */
  async handleMessage(
    message: ExtensionMessage,
    _sender: MessageSender,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      switch (message.action) {
      case 'activateInspection':
        await this.handleActivateInspection(message.tabId!, sendResponse);
        break;
      case 'deactivateInspection':
        await this.handleDeactivateInspection(message.tabId!, sendResponse);
        break;
      case 'getInspectionState':
        await this.handleGetInspectionState(message.tabId!, sendResponse);
        break;
      case 'updatePreferences':
        await this.handleUpdatePreferences(message.preferences, sendResponse);
        break;
      case 'getPreferences':
        await this.handleGetPreferences(sendResponse);
        break;
      case 'saveToHistory':
        await this.handleSaveToHistory(message.locatorData, sendResponse);
        break;
      case 'getHistory':
        await this.handleGetHistory(sendResponse);
        break;
      case 'clearHistory':
        await this.handleClearHistory(sendResponse);
        break;
      case 'getStorageStats':
        await this.handleGetStorageStats(sendResponse);
        break;
      default:
        sendResponse({
          success: false,
          error: `Unknown action: ${message.action}`
        });
      }
    } catch (error) {
      await this.logError('handleMessage', error as Error, { action: message.action });
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
     * Handles activation of inspection mode
     */
  private async handleActivateInspection(tabId: number, sendResponse: (response: any) => void): Promise<void> {
    try {
      // Check if page supports content script injection
      const isSupported = await this.isPageSupported(tabId);
      if (!isSupported) {
        sendResponse({
          success: false,
          error: 'Content script injection not supported on this page type'
        });
        return;
      }

      // Attempt content script injection with retry logic
      await this.injectContentScriptWithRetry(tabId);

      await this.setInspectionState(tabId, true);
      await this.updateBadge(tabId, true);
      await this.updateIcon(tabId, true);
      await this.broadcastStateChange(tabId, true);

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
     * Checks if the current page supports content script injection
     * 
     * Validates the page URL to determine if content script injection is allowed.
     * Rejects chrome://, chrome-extension://, file://, and other restricted page types.
     * 
     * @param tabId - The ID of the tab to check
     * @returns Promise<boolean> - True if injection is supported, false otherwise
     * @throws Error if tab query fails
     * 
     * @example
     * ```typescript
     * const isSupported = await this.isPageSupported(123);
     * if (!isSupported) {
     *   // Handle unsupported page type
     * }
     * ```
     */
  private async isPageSupported(tabId: number): Promise<boolean> {
    try {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find(t => t.id === tabId);

      if (!tab || !tab.url) {
        return false;
      }

      const url = tab.url.toLowerCase();

      // Check for unsupported page types
      if (url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('file://') ||
        url.startsWith('moz-extension://') ||
        url.startsWith('edge-extension://')) {
        return false;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to query tab information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
     * Injects content script with exponential backoff retry logic
     * 
     * Attempts to inject the content script with automatic retry on failure.
     * Uses exponential backoff delays: 1000ms, 2000ms, 4000ms for subsequent attempts.
     * 
     * @param tabId - The ID of the tab to inject the script into
     * @param maxRetries - Maximum number of retry attempts (default: 3)
     * @throws Error if all retry attempts fail
     * 
     * @example
     * ```typescript
     * try {
     *   await this.injectContentScriptWithRetry(123);
     *   console.log('Content script injected successfully');
     * } catch (error) {
     *   console.error('Failed to inject after retries:', error.message);
     * }
     * ```
     */
  private async injectContentScriptWithRetry(tabId: number, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content/content-script.js']
        });
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          // Calculate exponential backoff delay: 1000ms, 2000ms, 4000ms...
          const delay = 1000 * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to inject content script after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
     * Utility method for creating delays in async operations
     * 
     * Creates a Promise that resolves after the specified number of milliseconds.
     * Used for implementing exponential backoff delays in retry logic.
     * 
     * @param ms - Number of milliseconds to delay
     * @returns Promise<void> - Resolves after the specified delay
     * 
     * @example
     * ```typescript
     * await this.delay(1000); // Wait 1 second
     * console.log('Executed after delay');
     * ```
     */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
     * Handles deactivation of inspection mode
     */
  private async handleDeactivateInspection(tabId: number, sendResponse: (response: any) => void): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'deactivateInspection'
      });

      await this.setInspectionState(tabId, false);
      await this.updateBadge(tabId, false);
      await this.updateIcon(tabId, false);
      await this.broadcastStateChange(tabId, false);

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: `Failed to communicate with tab: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
     * Handles getting inspection state for a tab
     */
  private async handleGetInspectionState(tabId: number, sendResponse: (response: any) => void): Promise<void> {
    const isActive = await this.getInspectionState(tabId);
    sendResponse({ success: true, isActive });
  }

  /**
     * Sets inspection state for a specific tab
     */
  async setInspectionState(tabId: number, isActive: boolean): Promise<void> {
    this.inspectionStates.set(tabId, isActive);
  }

  /**
     * Gets inspection state for a specific tab
     */
  async getInspectionState(tabId: number): Promise<boolean> {
    return this.inspectionStates.get(tabId) || false;
  }

  /**
     * Handles tab removal by cleaning up state
     */
  async handleTabRemoved(tabId: number): Promise<void> {
    this.inspectionStates.delete(tabId);
  }

  /**
     * Broadcasts state changes to all tabs
     */
  async broadcastStateChange(_tabId: number, isActive: boolean): Promise<void> {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'inspectionStateChanged',
            isActive
          });
        } catch (error) {
          // Ignore errors for tabs that can't receive messages
        }
      }
    }
  }

  /**
     * Updates extension badge based on inspection state
     */
  async updateBadge(tabId: number, isActive: boolean): Promise<void> {
    if (isActive) {
      await chrome.action.setBadgeText({ text: '●', tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
    } else {
      await chrome.action.setBadgeText({ text: '', tabId });
    }
  }

  /**
     * Updates extension icon based on inspection state
     */
  async updateIcon(tabId: number, isActive: boolean): Promise<void> {
    const iconPath = isActive ? {
      '16': 'icons/icon-active-16.png',
      '32': 'icons/icon-active-32.png',
      '48': 'icons/icon-active-48.png',
      '128': 'icons/icon-active-128.png'
    } : {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png'
    };

    await chrome.action.setIcon({ path: iconPath, tabId });
  }

  /**
     * Handles tab activation events
     */
  private async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo): Promise<void> {
    // Update UI state when switching tabs
    const isActive = await this.getInspectionState(activeInfo.tabId);
    await this.updateBadge(activeInfo.tabId, isActive);
    await this.updateIcon(activeInfo.tabId, isActive);
  }

  /**
     * Handles tab update events
     */
  private async handleTabUpdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo): Promise<void> {
    // Reset inspection state when tab navigates to new URL
    if (changeInfo.status === 'loading' && changeInfo.url) {
      await this.setInspectionState(tabId, false);
      await this.updateBadge(tabId, false);
      await this.updateIcon(tabId, false);
    }
  }

  /**
     * Handles preference update messages
     */
  private async handleUpdatePreferences(preferences: UserPreferences, sendResponse: (response: any) => void): Promise<void> {
    try {
      if (!validateUserPreferences(preferences)) {
        sendResponse({
          success: false,
          error: 'Invalid preferences data'
        });
        return;
      }

      await this.storageManager.savePreferences(preferences);
      await this.broadcastPreferenceUpdate(preferences);

      sendResponse({ success: true });
    } catch (error) {
      await this.logError('Storage coordination', error as Error, { action: 'updatePreferences' });
      sendResponse({
        success: false,
        error: `Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
     * Handles preference retrieval messages
     */
  private async handleGetPreferences(sendResponse: (response: any) => void): Promise<void> {
    try {
      const preferences = await this.storageManager.loadPreferences();
      sendResponse({
        success: true,
        preferences
      });
    } catch (error) {
      await this.logError('Storage coordination', error as Error, { action: 'getPreferences' });
      sendResponse({
        success: false,
        error: `Failed to retrieve preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
     * Handles history save messages
     */
  private async handleSaveToHistory(locatorData: LocatorData, sendResponse: (response: any) => void): Promise<void> {
    try {
      await this.storageManager.saveToHistory(locatorData);
      sendResponse({ success: true });
    } catch (error) {
      await this.logError('Storage coordination', error as Error, { action: 'saveToHistory' });
      sendResponse({
        success: false,
        error: `Failed to save to history: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
     * Handles history retrieval messages
     */
  private async handleGetHistory(sendResponse: (response: any) => void): Promise<void> {
    try {
      const history = await this.storageManager.loadHistory();
      sendResponse({
        success: true,
        history
      });
    } catch (error) {
      await this.logError('Storage coordination', error as Error, { action: 'getHistory' });
      sendResponse({
        success: false,
        error: `Failed to retrieve history: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
     * Handles history clearing messages
     */
  private async handleClearHistory(sendResponse: (response: any) => void): Promise<void> {
    try {
      await this.storageManager.clearHistory();
      sendResponse({ success: true });
    } catch (error) {
      await this.logError('Storage coordination', error as Error, { action: 'clearHistory' });
      sendResponse({
        success: false,
        error: `Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
     * Handles storage statistics requests
     */
  private async handleGetStorageStats(sendResponse: (response: any) => void): Promise<void> {
    try {
      const stats = await this.storageManager.getStorageStats();
      sendResponse({
        success: true,
        stats
      });
    } catch (error) {
      await this.logError('Storage coordination', error as Error, { action: 'getStorageStats' });
      sendResponse({
        success: false,
        error: `Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
     * Broadcasts preference updates to all tabs
     */
  async broadcastPreferenceUpdate(preferences: UserPreferences): Promise<void> {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'preferencesUpdated',
            preferences
          });
        } catch (error) {
          // Ignore errors for tabs that can't receive messages
        }
      }
    }
  }

  /**
     * Logs errors with context information
     */
  async logError(operation: string, error: Error, context: ErrorContext = {}): Promise<void> {
    // eslint-disable-next-line no-console
    console.error(`[ServiceWorker] ${operation} failed:`, error, context);
  }
}