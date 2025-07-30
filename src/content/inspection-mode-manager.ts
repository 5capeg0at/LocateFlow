/**
 * @fileoverview InspectionModeManager - Manages inspection mode state and page interaction prevention
 * 
 * This class handles inspection mode activation/deactivation, prevents default page interactions
 * during inspection mode, and manages communication with the service worker.
 * 
 * Requirements Coverage:
 * - Requirement 1.1: Extension inspection mode activation
 * - Requirement 1.6: Page interaction prevention during inspection mode
 * 
 * Architecture:
 * - Single responsibility: focused on inspection mode state management
 * - Event-driven architecture for DOM interaction prevention
 * - Service worker communication for cross-component coordination
 * - Callback system for integration with other components
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

/**
 * Message types for service worker communication
 */
interface ServiceWorkerMessage {
  type: string;
}

/**
 * InspectionModeManager class for managing inspection mode state and interactions
 */

import { logger } from '../shared/logger';

export class InspectionModeManager {
  private isActive: boolean = false;
  private clickHandler: (event: Event) => void;
  private submitHandler: (event: Event) => void;
  private messageListener: (message: any, sender: any, sendResponse: any) => void;
  private activationCallbacks: (() => void)[] = [];
  private deactivationCallbacks: (() => void)[] = [];

  constructor() {
    // Bind event handlers to maintain context
    this.clickHandler = this.handleClick.bind(this);
    this.submitHandler = this.handleSubmit.bind(this);
    this.messageListener = this.handleMessage.bind(this);

    // Register service worker message listener
    this.registerMessageListener();
  }

  /**
     * Check if inspection mode is currently active
     */
  isInspectionModeActive(): boolean {
    return this.isActive;
  }

  /**
     * Activate inspection mode
     */
  activateInspectionMode(): void {
    if (this.isActive) {
      return; // Already active
    }

    this.isActive = true;

    // Add event listeners to prevent default interactions
    this.addEventListeners();

    // Notify service worker
    this.notifyServiceWorker('INSPECTION_MODE_ACTIVATED');

    // Trigger activation callbacks
    this.activationCallbacks.forEach(callback => callback());
  }

  /**
     * Deactivate inspection mode
     */
  deactivateInspectionMode(): void {
    if (!this.isActive) {
      return; // Already inactive
    }

    this.isActive = false;

    // Remove event listeners
    this.removeEventListeners();

    // Notify service worker
    this.notifyServiceWorker('INSPECTION_MODE_DEACTIVATED');

    // Trigger deactivation callbacks
    this.deactivationCallbacks.forEach(callback => callback());
  }

  /**
     * Dispose of the manager and clean up all listeners
     */
  dispose(): void {
    // Deactivate if currently active
    if (this.isActive) {
      this.deactivateInspectionMode();
    }

    // Remove message listener
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
    }

    // Clear callbacks
    this.activationCallbacks = [];
    this.deactivationCallbacks = [];
  }

  /**
     * Register callback for mode activation
     */
  onModeActivated(callback: () => void): void {
    this.activationCallbacks.push(callback);
  }

  /**
     * Register callback for mode deactivation
     */
  onModeDeactivated(callback: () => void): void {
    this.deactivationCallbacks.push(callback);
  }

  /**
     * Add event listeners for interaction prevention
     */
  private addEventListeners(): void {
    try {
      document.addEventListener('click', this.clickHandler, true);
      document.addEventListener('submit', this.submitHandler, true);
    } catch (error) {
      // Handle DOM errors gracefully
      logger.warn('InspectionModeManager: Failed to add event listeners', error);
    }
  }

  /**
     * Remove event listeners
     */
  private removeEventListeners(): void {
    try {
      document.removeEventListener('click', this.clickHandler, true);
      document.removeEventListener('submit', this.submitHandler, true);
    } catch (error) {
      // Handle DOM errors gracefully
      logger.warn('InspectionModeManager: Failed to remove event listeners', error);
    }
  }

  /**
     * Handle click events during inspection mode
     */
  private handleClick(event: Event): void {
    if (this.isActive) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (error) {
        // Handle event prevention errors gracefully
        logger.warn('InspectionModeManager: Failed to prevent click event', error);
      }
    }
  }

  /**
     * Handle submit events during inspection mode
     */
  private handleSubmit(event: Event): void {
    if (this.isActive) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (error) {
        // Handle event prevention errors gracefully
        logger.warn('InspectionModeManager: Failed to prevent submit event', error);
      }
    }
  }

  /**
     * Register message listener for service worker communication
     */
  private registerMessageListener(): void {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(this.messageListener);
    }
  }

  /**
     * Handle messages from service worker
     */
  private handleMessage(message: any, _sender: any, sendResponse: any): void {
    try {
      switch (message.type) {
        case 'ACTIVATE_INSPECTION_MODE':
          this.activateInspectionMode();
          sendResponse({ success: true });
          break;
        case 'DEACTIVATE_INSPECTION_MODE':
          this.deactivateInspectionMode();
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ success: false, error: errorMessage });
    }
  }

  /**
     * Notify service worker of mode changes
     */
  private notifyServiceWorker(messageType: string): void {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const message: ServiceWorkerMessage = {
          type: messageType,
          // tabId is omitted - service worker will determine it from sender
        };
        chrome.runtime.sendMessage(message);
      }
    } catch (error) {
      // Handle communication errors gracefully
      logger.warn('InspectionModeManager: Failed to notify service worker', error);
    }
  }


}