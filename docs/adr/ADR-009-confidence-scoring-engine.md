# ADR-009: Unified Confidence Scoring Engine

Date: 2025-07-24
Status: Accepted
Deciders: LocateFlow Development Team

## Context

The LocateFlow Chrome Extension generates multiple types of locators (CSS, XPath, ID, Class, Name, Tag, ARIA) for DOM elements. Each locator type previously had its own confidence scoring logic embedded within individual generators, leading to:

- **Inconsistent scoring algorithms** across different locator types
- **Code duplication** in confidence calculation logic
- **Difficulty in maintaining** unified scoring standards
- **Limited cross-strategy comparison** capabilities
- **Fragmented pattern detection** for auto-generated selectors

Requirements 3.1-3.4 specify the need for:
- Detailed confidence scoring with explanations
- Confidence scoring for locator reliability assessment
- Warnings for low confidence scores
- Uniqueness validation and stability assessment

## Decision

We have implemented a **Unified Confidence Scoring Engine** (`ConfidenceScoringEngine`) that provides centralized confidence assessment for all locator types with the following architecture:

### Core Algorithm Components

1. **Uniqueness Factor (40% weight)**
   - Evaluates whether the locator uniquely identifies the target element
   - Positive impact: +40 points for unique selectors
   - Negative impact: 0 points for non-unique selectors with warning

2. **Stability Factor (35% weight)**
   - Assesses likelihood that locator will survive DOM changes
   - Type-specific stability algorithms for each locator type
   - Pattern-based analysis (auto-generated, semantic, utility classes)

3. **Type Reliability Factor (15% weight)**
   - Inherent reliability hierarchy: ID > ARIA > Name > CSS > Class > XPath > Tag
   - Accounts for fundamental reliability differences between locator types

4. **Pattern Analysis Factor (10% weight)**
   - Detects beneficial patterns (semantic naming, accessibility-friendly)
   - Identifies problematic patterns (auto-generated, position-based)
   - Provides specific warnings for fragile patterns

### Stability Assessment Algorithms

**ID Stability:**
- Semantic IDs (e.g., "submit-button"): 95/100
- Structured IDs (e.g., "form-field-email"): 85/100
- Generic IDs: 70/100
- Auto-generated IDs (e.g., "auto-12345"): 30/100
- UUID patterns: 25/100

**Class Stability:**
- Semantic classes (e.g., "navigation-menu"): 85/100
- BEM-style classes (e.g., "block__element--modifier"): 80/100
- Utility classes (e.g., "mt-4"): 65/100
- Generic classes: 60/100
- CSS-in-JS classes (e.g., "css-1a2b3c4d"): 25/100

**XPath Stability:**
- ID-based XPath: 95/100
- Attribute-based XPath: 75/100
- Class-based XPath (non-positional): 65/100
- Text-based XPath: 55/100
- Position-based XPath: 35/100
- Absolute path XPath: 15/100

### Pattern Detection System

The engine detects the following patterns:

- **Auto-generated patterns**: CSS-in-JS classes, UUID IDs, numeric suffixes
- **Position-based patterns**: XPath with indices, nth-child selectors
- **Semantic patterns**: Descriptive naming conventions
- **Accessibility patterns**: ARIA attributes, semantic roles
- **Utility patterns**: Framework utility classes (Tailwind, Bootstrap)
- **BEM patterns**: Block-Element-Modifier methodology

### Strategy Comparison Algorithm

Locator strategies are ranked using a hierarchical approach:

1. **Type hierarchy** (primary): ID > ARIA > Name > CSS > Class > XPath > Tag
2. **Uniqueness** (secondary): Unique selectors ranked higher
3. **Confidence score** (tertiary): Higher scores ranked higher

## Consequences

### Positive:

- **Consistent scoring** across all locator types using unified algorithm
- **Comprehensive factor analysis** with detailed explanations for users
- **Centralized pattern detection** for auto-generated and fragile selectors
- **Maintainable architecture** with single source of truth for confidence logic
- **Extensible design** allowing easy addition of new locator types
- **Detailed warnings** help users understand locator reliability issues
- **Cross-strategy comparison** enables optimal locator selection

### Negative:

- **Additional complexity** in the codebase with new abstraction layer
- **Performance overhead** from comprehensive pattern analysis
- **Potential inconsistency** if individual generators bypass the unified engine
- **Learning curve** for developers maintaining confidence scoring logic

### Mitigation:

- **Comprehensive test coverage** (33 test cases) ensures reliability
- **Clear documentation** and ADR explain algorithm decisions
- **Performance optimization** through efficient pattern matching
- **Integration guidelines** ensure consistent usage across generators
- **Modular design** allows selective algorithm updates

## Implementation Notes

### Technical Architecture

```typescript
class ConfidenceScoringEngine {
    calculateConfidenceScore(strategy, element, document): ConfidenceScore
    assessStability(type, selector): number
    detectPatterns(type, selector): string[]
    generateExplanation(strategy): string
    compareStrategies(a, b): number
}
```

### Integration Pattern

Individual locator generators should:
1. Generate the locator selector
2. Determine uniqueness and stability flags
3. Pass the strategy to `ConfidenceScoringEngine.calculateConfidenceScore()`
4. Use the returned confidence score and explanation

### Quality Gates

- **Minimum 90% test coverage** achieved (100% for critical paths)
- **All public methods tested** with comprehensive edge cases
- **Pattern detection validated** for all supported frameworks
- **Cross-browser compatibility** ensured through DOM API usage
- **Error handling** for malformed selectors and DOM query failures

### Future Extensions

The engine is designed to support:
- **Custom pattern definitions** for specific frameworks
- **Machine learning integration** for pattern recognition improvement
- **Performance metrics** for confidence score accuracy validation
- **User feedback integration** to refine scoring algorithms
- **Framework-specific optimizations** (React, Angular, Vue)

This unified approach provides the foundation for reliable, consistent, and maintainable confidence scoring across the entire LocateFlow extension.