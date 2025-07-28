/**
 * @fileoverview ElementHighlighter - Element highlighting system for DOM interaction
 * 
 * This class provides element highlighting functionality for the LocateFlow Chrome Extension.
 * It manages visual feedback when users hover over elements during inspection mode.
 * 
 * Requirements Coverage:
 * - Requirement 1.2: Element highlighting with visual indicator on hover
 * - Requirement 1.6: Prevent default page interactions during inspection mode
 * 
 * Architecture:
 * - Follows single responsibility principle for element highlighting
 * - Uses event delegation for efficient DOM event handling
 * - Implements error handling for graceful degradation
 * - Provides callback system for external integration
 */

export class ElementHighlighter {
  private inspectionMode: boolean = false;
  private currentHighlightedElement: HTMLElement | null = null;
  private currentOverlay: HTMLElement | null = null;
  private hoverCallbacks: ((element: HTMLElement) => void)[] = [];
  private unhoverCallbacks: ((element: HTMLElement) => void)[] = [];

  // Event handler references for cleanup
  private mouseoverHandler: (event: Event) => void;
  private mouseoutHandler: (event: Event) => void;
  private clickHandler: (event: Event) => void;

  constructor() {
    // Bind event handlers to maintain context
    this.mouseoverHandler = this.handleMouseover.bind(this);
    this.mouseoutHandler = this.handleMouseout.bind(this);
    this.clickHandler = this.handleClick.bind(this);
  }

  /**
     * Check if inspection mode is currently active
     */
  isInspectionMode(): boolean {
    return this.inspectionMode;
  }

  /**
     * Get the currently highlighted element
     */
  getCurrentHighlightedElement(): HTMLElement | null {
    return this.currentHighlightedElement;
  }

  /**
     * Check if an element is currently being hovered
     */
  isHovering(): boolean {
    return this.currentHighlightedElement !== null;
  }

  /**
     * Enable inspection mode and add event listeners
     */
  enableInspectionMode(): void {
    if (this.inspectionMode) {
      return;
    }

    this.inspectionMode = true;

    // Add event listeners with capture phase for better control
    document.body.addEventListener('mouseover', this.mouseoverHandler, true);
    document.body.addEventListener('mouseout', this.mouseoutHandler, true);
    document.body.addEventListener('click', this.clickHandler, true);
  }

  /**
     * Disable inspection mode and clean up
     */
  disableInspectionMode(): void {
    if (!this.inspectionMode) {
      return;
    }

    this.inspectionMode = false;

    // Remove event listeners
    document.body.removeEventListener('mouseover', this.mouseoverHandler, true);
    document.body.removeEventListener('mouseout', this.mouseoutHandler, true);
    document.body.removeEventListener('click', this.clickHandler, true);

    // Remove any existing highlight
    this.removeHighlight();
  }

  /**
     * Highlight an element with visual overlay
     */
  highlightElement(element: HTMLElement): void {
    // Don't highlight if inspection mode is disabled
    if (!this.inspectionMode) {
      return;
    }

    // Handle null element gracefully
    if (!element) {
      return;
    }

    try {
      // Remove previous highlight
      this.removeHighlight();

      // Get element bounds
      const bounds = element.getBoundingClientRect();

      // Create overlay element
      const overlay = document.createElement('div');

      // Apply styling
      overlay.style.position = 'fixed';
      overlay.style.top = `${bounds.top}px`;
      overlay.style.left = `${bounds.left}px`;
      overlay.style.width = `${bounds.width}px`;
      overlay.style.height = `${bounds.height}px`;
      overlay.style.border = '2px solid #007acc';
      overlay.style.backgroundColor = 'rgba(0, 122, 204, 0.1)';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '999999';

      // Add to DOM
      document.body.appendChild(overlay);

      // Update state
      this.currentHighlightedElement = element;
      this.currentOverlay = overlay;

      // Notify hover callbacks
      this.hoverCallbacks.forEach(callback => callback(element));

    } catch (error) {
      // Handle errors gracefully - log but don't throw
      console.warn('ElementHighlighter: Failed to highlight element', error);
      this.currentHighlightedElement = null;
      this.currentOverlay = null;
    }
  }

  /**
     * Remove current highlight overlay
     */
  removeHighlight(): void {
    if (this.currentOverlay) {
      try {
        this.currentOverlay.remove();
      } catch (error) {
        // Handle removal errors gracefully
        console.warn('ElementHighlighter: Failed to remove overlay', error);
      }
    }

    const previousElement = this.currentHighlightedElement;
    this.currentOverlay = null;
    this.currentHighlightedElement = null;

    // Notify unhover callbacks
    if (previousElement) {
      this.unhoverCallbacks.forEach(callback => callback(previousElement));
    }
  }

  /**
     * Register callback for hover events
     */
  onHover(callback: (element: HTMLElement) => void): void {
    this.hoverCallbacks.push(callback);
  }

  /**
     * Register callback for unhover events
     */
  onUnhover(callback: (element: HTMLElement) => void): void {
    this.unhoverCallbacks.push(callback);
  }

  /**
     * Handle mouseover events
     */
  private handleMouseover(event: Event): void {
    const target = event.target as HTMLElement;
    if (target && target !== this.currentHighlightedElement) {
      this.highlightElement(target);
    }
  }

  /**
     * Handle mouseout events
     */
  private handleMouseout(event: Event): void {
    const target = event.target as HTMLElement;
    const relatedTarget = (event as MouseEvent).relatedTarget as HTMLElement;

    // Don't remove highlight if moving to a child element
    if (target && relatedTarget && target.contains && target.contains(relatedTarget)) {
      return;
    }

    // Remove highlight when leaving element
    if (target === this.currentHighlightedElement) {
      this.removeHighlight();
    }
  }

  /**
     * Handle click events - prevent default behavior during inspection
     */
  private handleClick(event: Event): void {
    // Prevent default click behavior during inspection
    event.preventDefault();
    event.stopPropagation();
  }
}