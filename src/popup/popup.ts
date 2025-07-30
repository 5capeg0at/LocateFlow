// LocateFlow Popup TypeScript

import { logger } from '../shared/logger';

interface LocatorHistoryItem {
  selector: string;
  url: string;
  timestamp: number;
}



interface InspectionResponse {
  success: boolean;
  isActive?: boolean;
}

class PopupManager {
  private inspectionToggle: HTMLButtonElement | null;
  private settingsButton: HTMLButtonElement | null;
  private clearHistoryButton: HTMLButtonElement | null;
  private historyList: HTMLElement | null;
  private popupContainer: HTMLElement | null;

  constructor() {
    this.inspectionToggle = document.getElementById('inspection-toggle') as HTMLButtonElement;
    this.settingsButton = document.getElementById('settings-button') as HTMLButtonElement;
    this.clearHistoryButton = document.getElementById('clear-history') as HTMLButtonElement;
    this.historyList = document.getElementById('history-list');
    this.popupContainer = document.querySelector('.popup-container');

    this.init();
  }

  private init(): void {
    this.setupEventListeners();
    this.loadTheme();
    // Load history asynchronously without blocking constructor
    this.loadHistory().catch(error => {
      logger.error('Failed to initialize history:', error);
    });
  }

  private setupEventListeners(): void {
    // Inspection toggle
    if (this.inspectionToggle) {
      this.inspectionToggle.addEventListener('click', () => {
        this.toggleInspection();
      });
    }

    // Settings button
    if (this.settingsButton) {
      this.settingsButton.addEventListener('click', () => {
        this.openSettings();
      });
    }

    // Clear history button
    if (this.clearHistoryButton) {
      this.clearHistoryButton.addEventListener('click', () => {
        this.clearHistory();
      });
    }
  }

  private async toggleInspection(): Promise<void> {
    try {
      const response: InspectionResponse = await chrome.runtime.sendMessage({
        action: 'toggleInspection'
      });

      if (response && response.success) {
        this.updateInspectionButtonState(response.isActive || false);
      }
    } catch (error) {
      logger.error('Failed to toggle inspection:', error);
    }
  }

  private updateInspectionButtonState(isActive: boolean): void {
    if (this.inspectionToggle) {
      if (isActive) {
        this.inspectionToggle.textContent = 'Stop Inspection';
        this.inspectionToggle.classList.add('active');
      } else {
        this.inspectionToggle.textContent = 'Start Inspection';
        this.inspectionToggle.classList.remove('active');
      }
    }
  }

  private async loadTheme(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['theme']);
      const theme = result.theme || 'light';
      this.applyTheme(theme);

      // Handle auto theme
      if (theme === 'auto') {
        this.setupAutoTheme();
      }
    } catch (error) {
      logger.error('Failed to load theme:', error);
      this.applyTheme('light'); // Fallback to light theme
    }
  }

  private applyTheme(theme: string): void {
    if (this.popupContainer) {
      // Remove existing theme classes
      this.popupContainer.classList.remove('theme-light', 'theme-dark');

      // Apply new theme
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.popupContainer.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
      } else {
        this.popupContainer.classList.add(`theme-${theme}`);
      }
    }
  }

  private setupAutoTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (this.popupContainer) {
        this.popupContainer.classList.remove('theme-light', 'theme-dark');
        this.popupContainer.classList.add(e.matches ? 'theme-dark' : 'theme-light');
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    handleThemeChange(mediaQuery as any); // Apply initial theme
  }

  private async loadHistory(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['locatorHistory']);
      const history: LocatorHistoryItem[] = result.locatorHistory || [];
      this.displayHistory(history);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load history:', error);
    }
  }

  private displayHistory(history: LocatorHistoryItem[]): void {
    if (this.historyList) {
      if (history.length === 0) {
        this.historyList.innerHTML = '<p class="empty-history">No recent locators</p>';
      } else {
        this.historyList.innerHTML = history.map(item => `
                    <div class="history-item">
                        <div class="history-locator">${this.escapeHtml(item.selector)}</div>
                        <div class="history-meta">
                            <span class="history-url">${this.escapeHtml(item.url)}</span>
                            <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <button class="copy-btn" data-selector="${this.escapeHtml(item.selector)}">Copy</button>
                    </div>
                `).join('');

        // Add copy button listeners
        this.historyList.querySelectorAll('.copy-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            const selector = target.getAttribute('data-selector');
            if (selector) {
              this.copyToClipboard(selector);
            }
          });
        });
      }
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      // Could add visual feedback here
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy to clipboard:', error);
    }
  }

  private async clearHistory(): Promise<void> {
    // Show confirmation dialog before clearing
    const confirmed = confirm('Are you sure you want to clear all history?');
    if (!confirmed) {
      return;
    }

    try {
      await chrome.storage.local.set({ locatorHistory: [] });
      this.displayHistory([]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear history:', error);
    }
  }

  private openSettings(): void {
    chrome.runtime.openOptionsPage();
  }
}

// Export for testing
export { PopupManager };

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});