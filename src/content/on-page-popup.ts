/**
 * @fileoverview OnPagePopup - On-page popup UI with tabbed interface
 * 
 * This module implements the on-page popup UI that appears when users hover over
 * elements during inspection mode. It provides a tabbed interface for locators
 * and ARIA information, with keyboard hotkey support for efficient navigation.
 * 
 * Requirements implemented:
 * - 2.3: Tabbed interface to organize different views (Locators, ARIA)
 * - 2.4: Keyboard hotkey support for tab switching (1, 2, 3...)
 * - 4.1: Dedicated ARIA tab in on-page popup
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

import { LocatorStrategy } from '../shared/data-models';
import { AriaAnalysisEngine } from '../shared/aria-analysis-engine';
import { AriaLocatorGenerator } from '../shared/aria-locator-generator';
import { logger } from '../shared/logger';

/**
 * Position coordinates for popup placement
 */
export interface PopupPosition {
  x: number;
  y: number;
}

/**
 * Callback function type for copy operations
 */
export type CopyCallback = (selector: string, type: string) => void;

/**
 * OnPagePopup class manages the on-page popup UI with tabbed interface
 * 
 * Features:
 * - Smart positioning near cursor with screen edge detection
 * - Tabbed interface for Locators and ARIA views
 * - Keyboard hotkey support (1, 2, 3...)
 * - Copy functionality for locators
 * - ARIA snapshot generation
 */
export class OnPagePopup {
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private copyCallback: CopyCallback | null = null;
  private ariaEngine: AriaAnalysisEngine;
  private ariaGenerator: AriaLocatorGenerator;
  private currentElement: HTMLElement | null = null;

  constructor() {
    this.ariaEngine = new AriaAnalysisEngine();
    this.ariaGenerator = new AriaLocatorGenerator();
  }

  /**
     * Shows the popup at the specified position with given locator strategies
     * 
     * @param position - Coordinates where to display the popup
     * @param strategies - Array of locator strategies to display
     * @param element - The element being inspected (optional)
     */
  public show(position: PopupPosition, strategies: LocatorStrategy[], element?: HTMLElement): void {
    // Remove existing popup if present
    this.hide();

    // Store current element for ARIA functionality
    this.currentElement = element || null;

    // Create popup container
    const container = document.createElement('div');
    container.id = 'locateflow-popup';
    container.className = 'locateflow-popup';

    // Position popup with smart placement
    this.positionPopup(container, position);

    // Create tabbed interface
    this.createTabbedInterface(container, strategies);

    // Add to DOM
    document.body.appendChild(container);

    // Register keyboard event listener
    this.registerKeyboardHandlers();
  }

  /**
     * Hides the popup and cleans up event listeners
     */
  public hide(): void {
    const existingPopup = document.getElementById('locateflow-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // Remove keyboard event listener
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }

  /**
     * Registers a callback function for copy operations
     * 
     * @param callback - Function to call when a locator is copied
     */
  public onCopy(callback: CopyCallback): void {
    this.copyCallback = callback;
  }

  /**
     * Positions the popup container with smart placement logic
     * 
     * @param container - The popup container element
     * @param position - Desired position coordinates
     */
  private positionPopup(container: HTMLElement, position: PopupPosition): void {
    container.style.position = 'fixed';
    container.style.zIndex = '2147483647'; // Maximum z-index

    // Default positioning with offset
    let left = position.x + 10;
    let top = position.y + 10;

    // Adjust for screen edges after container is created
    // Note: In real implementation, we'd need to measure container dimensions
    // For now, using estimated dimensions for edge detection
    const estimatedWidth = 300;
    const estimatedHeight = 200;

    if (left + estimatedWidth > window.innerWidth) {
      left = position.x - estimatedWidth - 10;
    }

    if (top + estimatedHeight > window.innerHeight) {
      top = position.y - estimatedHeight - 10;
    }

    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
  }

  /**
     * Creates the tabbed interface structure
     * 
     * @param container - The popup container element
     * @param strategies - Array of locator strategies to display
     */
  private createTabbedInterface(container: HTMLElement, strategies: LocatorStrategy[]): void {
    // Create tab container
    const tabContainer = document.createElement('div');
    tabContainer.className = 'locateflow-tabs';

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'locateflow-content';

    // Create tabs
    this.createTabs(tabContainer);

    // Create tab content
    this.createTabContent(contentContainer, strategies);

    // Add to popup container
    container.appendChild(tabContainer);
    container.appendChild(contentContainer);
  }

  /**
     * Creates the tab buttons
     * 
     * @param tabContainer - Container for tab buttons
     */
  private createTabs(tabContainer: HTMLElement): void {
    // Create Locators tab
    const locatorsTab = document.createElement('div');
    locatorsTab.className = 'locateflow-tab active';
    locatorsTab.textContent = 'Locators (1)';
    locatorsTab.dataset.tabId = 'locators';
    locatorsTab.addEventListener('click', () => this.switchTab('locators'));

    // Create ARIA tab
    const ariaTab = document.createElement('div');
    ariaTab.className = 'locateflow-tab';
    ariaTab.textContent = 'ARIA (2)';
    ariaTab.dataset.tabId = 'aria';
    ariaTab.addEventListener('click', () => this.switchTab('aria'));

    tabContainer.appendChild(locatorsTab);
    tabContainer.appendChild(ariaTab);
  }

  /**
     * Creates the content areas for each tab
     * 
     * @param contentContainer - Container for tab content
     * @param strategies - Array of locator strategies to display
     */
  private createTabContent(contentContainer: HTMLElement, strategies: LocatorStrategy[]): void {
    // Create locators content
    const locatorsContent = this.createLocatorsContent(strategies);
    locatorsContent.id = 'locateflow-content-locators';
    locatorsContent.style.display = 'block'; // Initially visible

    // Create ARIA content
    const ariaContent = this.createAriaContent();
    ariaContent.id = 'locateflow-content-aria';
    ariaContent.style.display = 'none'; // Initially hidden

    contentContainer.appendChild(locatorsContent);
    contentContainer.appendChild(ariaContent);
  }

  /**
     * Creates the locators tab content
     * 
     * @param strategies - Array of locator strategies to display
     * @returns The locators content element
     */
  private createLocatorsContent(strategies: LocatorStrategy[]): HTMLElement {
    const locatorsList = document.createElement('div');
    locatorsList.className = 'locateflow-locators';

    // Create elements programmatically to avoid HTML parsing issues
    strategies.forEach(strategy => {
      const locatorItem = document.createElement('div');
      locatorItem.className = 'locator-item';

      const locatorInfo = document.createElement('div');
      locatorInfo.className = 'locator-info';

      const typeSpan = document.createElement('span');
      typeSpan.className = 'locator-type';
      typeSpan.textContent = strategy.type.toUpperCase();

      const selectorSpan = document.createElement('span');
      selectorSpan.className = 'locator-selector';
      selectorSpan.textContent = strategy.selector;

      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'confidence-score';
      scoreSpan.textContent = `${strategy.confidence.score}%`;

      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.textContent = 'Copy';
      copyButton.dataset.selector = strategy.selector;
      copyButton.dataset.type = strategy.type;

      locatorInfo.appendChild(typeSpan);
      locatorInfo.appendChild(selectorSpan);
      locatorInfo.appendChild(scoreSpan);

      locatorItem.appendChild(locatorInfo);
      locatorItem.appendChild(copyButton);

      locatorsList.appendChild(locatorItem);
    });

    // Add click handler for copy buttons
    locatorsList.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('copy-button')) {
        const selector = target.dataset.selector;
        const type = target.dataset.type;
        if (selector && type && this.copyCallback) {
          this.copyCallback(selector, type);
        }
      }
    });

    return locatorsList;
  }

  /**
     * Creates the ARIA tab content
     * 
     * @returns The ARIA content element
     */
  private createAriaContent(): HTMLElement {
    const ariaContent = document.createElement('div');
    ariaContent.className = 'locateflow-aria-content';

    // Generate ARIA locator suggestions if element is available
    const ariaLocatorsSection = this.createAriaLocatorsSection();

    // Create ARIA snapshot section
    const snapshotSection = document.createElement('div');
    snapshotSection.className = 'aria-section';
    snapshotSection.innerHTML = `
      <h3>ARIA Snapshot</h3>
      <p>Generate a detailed accessibility snapshot of the selected element.</p>
      <button class="aria-button" data-action="generate-aria">
        Generate ARIA Snapshot
      </button>
    `;

    ariaContent.appendChild(ariaLocatorsSection);
    ariaContent.appendChild(snapshotSection);

    // Add event listener for ARIA snapshot generation
    this.addAriaEventListeners(ariaContent);

    return ariaContent;
  }

  /**
     * Switches to the specified tab
     * 
     * @param tabId - ID of the tab to switch to
     */
  private switchTab(tabId: string): void {
    // Update tab active states
    const tabs = document.querySelectorAll('.locateflow-tab');
    tabs.forEach(tab => {
      const element = tab as HTMLElement;
      if (element.dataset.tabId === tabId) {
        element.className = 'locateflow-tab active';
      } else {
        element.className = 'locateflow-tab';
      }
    });

    // Update content visibility
    const locatorsContent = document.getElementById('locateflow-content-locators');
    const ariaContent = document.getElementById('locateflow-content-aria');

    if (locatorsContent && ariaContent) {
      if (tabId === 'locators') {
        locatorsContent.style.display = 'block';
        ariaContent.style.display = 'none';
      } else if (tabId === 'aria') {
        locatorsContent.style.display = 'none';
        ariaContent.style.display = 'block';
      }
    }
  }

  /**
     * Registers keyboard event handlers for hotkey support
     */
  private registerKeyboardHandlers(): void {
    this.keydownHandler = (event: KeyboardEvent) => {
      // Handle number keys 1-9 for tab switching
      if (event.key >= '1' && event.key <= '9') {
        const tabNumber = parseInt(event.key);
        let tabId = '';

        switch (tabNumber) {
          case 1:
            tabId = 'locators';
            break;
          case 2:
            tabId = 'aria';
            break;
          default:
            return; // Ignore other numbers for now
        }

        // Find and click the corresponding tab
        const tab = document.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement;
        if (tab) {
          event.preventDefault();
          tab.click();
        }
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
  }

  /**
     * Copies text to clipboard using the Clipboard API
     * 
     * @param text - Text to copy to clipboard
     * @returns Promise that resolves when copy is complete
     */
  public async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Handle clipboard errors gracefully - could fallback to execCommand
      logger.warn('Failed to copy to clipboard:', error);
    }
  }

  /**
     * Gets the highest-rated locator selector from strategies
     * 
     * @param strategies - Array of locator strategies
     * @returns The selector string of the highest-rated strategy
     */
  public getHighestRatedLocator(strategies: LocatorStrategy[]): string {
    if (strategies.length === 0) {
      return '';
    }

    // Strategies should already be sorted by confidence score (highest first)
    return strategies[0].selector;
  }

  /**
     * Auto-copies the highest-rated locator to clipboard
     * 
     * @param strategies - Array of locator strategies
     * @returns Promise that resolves when copy is complete
     */
  public async autoCopyHighestRatedLocator(strategies: LocatorStrategy[]): Promise<void> {
    const highestRatedSelector = this.getHighestRatedLocator(strategies);
    if (highestRatedSelector) {
      await this.copyToClipboard(highestRatedSelector);
    }
  }

  /**
     * Creates the ARIA locators section showing available ARIA-based selectors
     * 
     * @returns The ARIA locators section element
     */
  private createAriaLocatorsSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'aria-locators-section';

    if (!this.currentElement) {
      section.innerHTML = '<p class="no-data">No element selected</p>';
      return section;
    }

    try {
      // Generate ARIA locator strategies for the current element
      const ariaStrategies = this.ariaGenerator.generateAllAriaStrategies(this.currentElement);

      if (ariaStrategies.length === 0) {
        section.innerHTML = '<p class="no-data">No ARIA attributes found</p>';
        return section;
      }

      // Create header
      const header = document.createElement('h3');
      header.textContent = 'ARIA Locators';
      section.appendChild(header);

      // Create locators list
      const locatorsList = document.createElement('div');
      locatorsList.className = 'aria-locators-list';

      ariaStrategies.forEach(strategy => {
        const locatorItem = document.createElement('div');
        locatorItem.className = 'aria-locator-item';

        const selectorSpan = document.createElement('span');
        selectorSpan.className = 'aria-selector';
        selectorSpan.textContent = strategy.selector;

        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'aria-confidence-score';
        scoreSpan.textContent = `${strategy.confidence.score}%`;

        const copyButton = document.createElement('button');
        copyButton.className = 'aria-copy-button';
        copyButton.textContent = 'Copy';
        copyButton.dataset.selector = strategy.selector;
        copyButton.dataset.type = 'aria';

        locatorItem.appendChild(selectorSpan);
        locatorItem.appendChild(scoreSpan);
        locatorItem.appendChild(copyButton);

        locatorsList.appendChild(locatorItem);
      });

      section.appendChild(locatorsList);

      // Add click handler for copy buttons
      locatorsList.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('aria-copy-button')) {
          const selector = target.dataset.selector;
          const type = target.dataset.type;
          if (selector && type && this.copyCallback) {
            this.copyCallback(selector, type);
          }
        }
      });

    } catch (error) {
      logger.warn('Failed to generate ARIA locators:', error);
      section.innerHTML = '<p class="error">Failed to generate ARIA locators</p>';
    }

    return section;
  }

  /**
     * Adds event listeners for ARIA functionality
     * 
     * @param ariaContent - The ARIA content container
     */
  private addAriaEventListeners(ariaContent: HTMLElement): void {
    ariaContent.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      if (target.dataset.action === 'generate-aria') {
        this.handleAriaSnapshotGeneration();
      }
    });
  }

  /**
     * Handles ARIA snapshot generation and display
     */
  private handleAriaSnapshotGeneration(): void {
    if (!this.currentElement) {
      logger.warn('No element available for ARIA snapshot generation');
      return;
    }

    try {
      // Generate ARIA snapshot
      const snapshot = this.ariaGenerator.generateAriaSnapshot(this.currentElement);

      // Display snapshot in new window
      this.ariaEngine.displaySnapshotInNewWindow(snapshot);
    } catch (error) {
      logger.error('Failed to generate ARIA snapshot:', error);
    }
  }

  /**
     * Public method for testing ARIA snapshot generation
     * @param element - Element to generate snapshot for
     */
  public generateAriaSnapshotForTesting(element: HTMLElement): void {
    this.currentElement = element;
    this.handleAriaSnapshotGeneration();
  }

}