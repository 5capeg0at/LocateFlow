// LocateFlow Popup JavaScript

class PopupManager {
  constructor() {
    this.inspectionToggle = document.getElementById('inspection-toggle');
    this.settingsButton = document.getElementById('settings-button');
    this.clearHistoryButton = document.getElementById('clear-history');
    this.historyList = document.getElementById('history-list');
    this.popupContainer = document.querySelector('.popup-container');

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadTheme();
    this.loadHistory();
  }

  setupEventListeners() {
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

  async toggleInspection() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'toggleInspection'
      });

      if (response && response.success) {
        this.updateInspectionButtonState(response.isActive);
      }
    } catch (error) {
      console.error('Failed to toggle inspection:', error);
    }
  }

  updateInspectionButtonState(isActive) {
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

  async loadTheme() {
    try {
      const result = await chrome.storage.local.get(['theme']);
      const theme = result.theme || 'light';
      this.applyTheme(theme);

      // Handle auto theme
      if (theme === 'auto') {
        this.setupAutoTheme();
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      this.applyTheme('light'); // Fallback to light theme
    }
  }

  applyTheme(theme) {
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

  setupAutoTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      this.popupContainer.classList.remove('theme-light', 'theme-dark');
      this.popupContainer.classList.add(e.matches ? 'theme-dark' : 'theme-light');
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    handleThemeChange(mediaQuery); // Apply initial theme
  }

  async loadHistory() {
    try {
      const result = await chrome.storage.local.get(['locatorHistory']);
      const history = result.locatorHistory || [];
      this.displayHistory(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  displayHistory(history) {
    if (this.historyList) {
      if (history.length === 0) {
        this.historyList.innerHTML = '<p class="empty-history">No recent locators</p>';
      } else {
        this.historyList.innerHTML = history.map(item => `
                    <div class="history-item">
                        <div class="history-locator">${item.selector}</div>
                        <div class="history-meta">
                            <span class="history-url">${item.url}</span>
                            <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <button class="copy-btn" data-selector="${item.selector}">Copy</button>
                    </div>
                `).join('');

        // Add copy button listeners
        this.historyList.querySelectorAll('.copy-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const selector = e.target.getAttribute('data-selector');
            this.copyToClipboard(selector);
          });
        });
      }
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      // Could add visual feedback here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  async clearHistory() {
    try {
      await chrome.storage.local.set({ locatorHistory: [] });
      this.displayHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});