/**
 * @fileoverview Core data models and interfaces for LocateFlow Chrome Extension
 * 
 * This module defines the fundamental data structures used across all components
 * of the LocateFlow Chrome Extension. It includes interfaces for locator strategies,
 * confidence scoring, element information, user preferences, and validation functions.
 * 
 * All interfaces follow strict typing and include comprehensive validation functions
 * to ensure data integrity throughout the application.
 * 
 * @author LocateFlow Development Team
 * @version 1.0.0
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported locator strategy types for element identification
 * 
 * @example
 * ```typescript
 * const strategy: LocatorType = 'css';
 * ```
 */
export type LocatorType = 'css' | 'xpath' | 'id' | 'class' | 'name' | 'tag' | 'aria';

/**
 * Theme options for the extension UI
 * 
 * @example
 * ```typescript
 * const userTheme: Theme = 'dark';
 * ```
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Impact type for confidence factors - indicates whether a factor
 * positively or negatively affects locator reliability
 * 
 * @example
 * ```typescript
 * const impact: Impact = 'positive';
 * ```
 */
export type Impact = 'positive' | 'negative';

/**
 * Factor that contributes to confidence scoring
 */
export interface ConfidenceFactor {
    factor: string;
    impact: Impact;
    weight: number;
    description: string;
}

/**
 * Confidence score with detailed breakdown
 */
export interface ConfidenceScore {
    score: number; // 0-100
    factors: ConfidenceFactor[];
    warnings: string[];
}

/**
 * A locator strategy with confidence information
 */
export interface LocatorStrategy {
    type: LocatorType;
    selector: string;
    confidence: ConfidenceScore;
    explanation: string;
    isUnique: boolean;
    isStable: boolean;
}

/**
 * Position information for a DOM element
 */
export interface ElementPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    bottom: number;
    right: number;
}

/**
 * Information about a DOM element
 */
export interface ElementInfo {
    tagName: string;
    textContent: string;
    attributes: Record<string, string>;
    position: ElementPosition;
    xpath: string;
}

/**
 * Complete locator data with metadata
 */
export interface LocatorData {
    id: string;
    timestamp: number;
    url: string;
    elementInfo: ElementInfo;
    strategies: LocatorStrategy[];
    screenshot?: string;
}

/**
 * User preferences for the extension
 */
export interface UserPreferences {
    theme: Theme;
    defaultLocatorTypes: LocatorType[];
    historyLimit: number;
    showConfidenceExplanations: boolean;
    enableScreenshots: boolean;
    highlightColor: string;
}

/**
 * Type guard to check if a string is a valid LocatorType
 */
export function isLocatorType(value: string): value is LocatorType {
  const validTypes: LocatorType[] = ['css', 'xpath', 'id', 'class', 'name', 'tag', 'aria'];
  return validTypes.includes(value as LocatorType);
}

/**
 * Type guard to check if a string is a valid Theme
 */
export function isTheme(value: string): value is Theme {
  const validThemes: Theme[] = ['light', 'dark', 'auto'];
  return validThemes.includes(value as Theme);
}

/**
 * Type guard to check if a string is a valid Impact
 */
export function isImpact(value: string): value is Impact {
  const validImpacts: Impact[] = ['positive', 'negative'];
  return validImpacts.includes(value as Impact);
}

/**
 * Validates a ConfidenceFactor object
 */
export function validateConfidenceFactor(factor: any): factor is ConfidenceFactor {
  return (
    typeof factor === 'object' &&
        factor !== null &&
        typeof factor.factor === 'string' &&
        isImpact(factor.impact) &&
        typeof factor.weight === 'number' &&
        factor.weight >= 0 &&
        factor.weight <= 1 &&
        typeof factor.description === 'string'
  );
}

/**
 * Validates a ConfidenceScore object
 */
export function validateConfidenceScore(score: any): score is ConfidenceScore {
  return (
    typeof score === 'object' &&
        score !== null &&
        typeof score.score === 'number' &&
        score.score >= 0 &&
        score.score <= 100 &&
        Array.isArray(score.factors) &&
        score.factors.every(validateConfidenceFactor) &&
        Array.isArray(score.warnings) &&
        score.warnings.every((w: any) => typeof w === 'string')
  );
}

/**
 * Validates a LocatorStrategy object
 */
export function validateLocatorStrategy(strategy: any): strategy is LocatorStrategy {
  return (
    typeof strategy === 'object' &&
        strategy !== null &&
        isLocatorType(strategy.type) &&
        typeof strategy.selector === 'string' &&
        validateConfidenceScore(strategy.confidence) &&
        typeof strategy.explanation === 'string' &&
        typeof strategy.isUnique === 'boolean' &&
        typeof strategy.isStable === 'boolean'
  );
}

/**
 * Validates an ElementPosition object
 */
export function validateElementPosition(position: any): position is ElementPosition {
  return (
    typeof position === 'object' &&
        position !== null &&
        typeof position.x === 'number' &&
        typeof position.y === 'number' &&
        typeof position.width === 'number' &&
        typeof position.height === 'number' &&
        typeof position.top === 'number' &&
        typeof position.left === 'number' &&
        typeof position.bottom === 'number' &&
        typeof position.right === 'number'
  );
}

/**
 * Validates an ElementInfo object
 */
export function validateElementInfo(info: any): info is ElementInfo {
  return (
    typeof info === 'object' &&
        info !== null &&
        typeof info.tagName === 'string' &&
        typeof info.textContent === 'string' &&
        typeof info.attributes === 'object' &&
        info.attributes !== null &&
        validateElementPosition(info.position) &&
        typeof info.xpath === 'string'
  );
}

/**
 * Validates a LocatorData object
 */
export function validateLocatorData(data: any): data is LocatorData {
  return (
    typeof data === 'object' &&
        data !== null &&
        typeof data.id === 'string' &&
        typeof data.timestamp === 'number' &&
        typeof data.url === 'string' &&
        validateElementInfo(data.elementInfo) &&
        Array.isArray(data.strategies) &&
        data.strategies.every(validateLocatorStrategy) &&
        (data.screenshot === undefined || typeof data.screenshot === 'string')
  );
}

/**
 * Validates a UserPreferences object
 */
export function validateUserPreferences(prefs: any): prefs is UserPreferences {
  return (
    typeof prefs === 'object' &&
        prefs !== null &&
        isTheme(prefs.theme) &&
        Array.isArray(prefs.defaultLocatorTypes) &&
        prefs.defaultLocatorTypes.every(isLocatorType) &&
        typeof prefs.historyLimit === 'number' &&
        prefs.historyLimit > 0 &&
        typeof prefs.showConfidenceExplanations === 'boolean' &&
        typeof prefs.enableScreenshots === 'boolean' &&
        typeof prefs.highlightColor === 'string' &&
        /^#[0-9a-fA-F]{6}$/.test(prefs.highlightColor)
  );
}

/**
 * Creates default user preferences
 */
export function createDefaultUserPreferences(): UserPreferences {
  return {
    theme: 'auto',
    defaultLocatorTypes: ['css', 'xpath', 'id', 'class', 'name'],
    historyLimit: 100,
    showConfidenceExplanations: true,
    enableScreenshots: false,
    highlightColor: '#007acc'
  };
}

/**
 * Serializes LocatorData to JSON string
 */
export function serializeLocatorData(data: LocatorData): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    throw new Error(`Failed to serialize LocatorData: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deserializes JSON string to LocatorData
 */
export function deserializeLocatorData(json: string): LocatorData {
  try {
    const parsed = JSON.parse(json);
    if (!validateLocatorData(parsed)) {
      throw new Error('Invalid LocatorData format');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Failed to deserialize LocatorData: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}