---
inclusion: always
---

# Architecture Decisions Record (ADR)

## Decision Documentation Requirements

Every architectural decision MUST be documented using this template:

### ADR Template:
```markdown
# ADR-XXXX: [Title]

Date: YYYY-MM-DD
Status: [Proposed | Accepted | Deprecated | Superseded]
Deciders: [List of decision makers]

## Context
[Describe the problem and constraints]

## Decision
[State the chosen solution]

## Consequences
### Positive:
- [List benefits]

### Negative:
- [List drawbacks and risks]

### Mitigation:
- [How to address negative consequences]

## Implementation Notes
[Technical details and implementation guidance]
```

## Architectural Principles

### SOLID Principles Enforcement:
- **Single Responsibility**: Each class/module has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Clients shouldn't depend on unused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

### Domain-Driven Design:
- Model business domain explicitly
- Use ubiquitous language consistently
- Maintain clear bounded contexts
- Separate domain logic from infrastructure

### Testing Architecture:
- Dependency injection for testability
- Clear separation of concerns
- Testable interfaces and abstractions
- Isolated unit test targets

## Code Organization Standards

### Layer Responsibilities:
- **Presentation**: UI components, controllers
- **Application**: Use cases, orchestration
- **Domain**: Business logic, entities
- **Infrastructure**: Data access, external services

### Dependency Rules:
- Dependencies point inward only
- Inner layers don't know about outer layers
- Use dependency injection at boundaries
- Abstract external dependencies with interfaces
---


# ADR-001: Dependency Injection for Chrome Extension Components

Date: 2025-01-30
Status: Accepted
Deciders: Development Team

## Context

During the implementation of the SettingsManager component, we encountered significant testing challenges due to global dependencies on browser APIs (chrome, document, window). The original implementation relied on global objects, making it difficult to:

1. **Test in isolation**: Tests were failing due to global state conflicts
2. **Mock dependencies**: Chrome APIs were not properly mockable in the test environment
3. **Control test environment**: Global mocks were being overridden by Jest setup files
4. **Maintain test reliability**: Tests were flaky due to shared global state

The specific issues encountered:
- Global chrome mock conflicts between test setup and individual tests
- Document/window objects not being properly injected into components
- Module caching issues preventing fresh imports with correct global state
- Complex test setup requiring manual global state management

## Decision

We will adopt **Constructor Dependency Injection** for all Chrome extension components that interact with browser APIs or DOM elements.

### Implementation Pattern:
```typescript
export interface ComponentDependencies {
    document?: Document;
    window?: Window;
    chrome?: typeof chrome;
}

export class Component {
    private document: Document;
    private window: Window;
    private chrome: typeof chrome;

    constructor(dependencies: ComponentDependencies = {}) {
        // Use injected dependencies or fall back to globals
        this.document = dependencies.document || 
            (typeof document !== 'undefined' ? document : (global as any).document);
        this.window = dependencies.window || 
            (typeof window !== 'undefined' ? window : (global as any).window);
        this.chrome = dependencies.chrome || 
            (typeof chrome !== 'undefined' ? chrome : (global as any).chrome);
    }
}
```

### Testing Pattern:
```typescript
test('should work correctly', () => {
    const mockChrome = { /* mock implementation */ };
    const component = new Component({
        document: testDocument,
        window: testWindow,
        chrome: mockChrome
    });
    
    // Test with controlled dependencies
});
```

## Consequences

### Positive:
- **Improved Testability**: Components can be tested in complete isolation
- **Reliable Tests**: No more global state conflicts or flaky tests
- **Better Mocking**: Full control over all external dependencies
- **Cleaner Test Setup**: No need for complex global mock management
- **Maintainable Code**: Clear dependency boundaries and explicit contracts
- **Future-Proof**: Easy to add new dependencies or change implementations

### Negative:
- **Slightly More Verbose**: Constructor signatures are longer
- **Migration Effort**: Existing components need to be refactored
- **Learning Curve**: Team needs to understand dependency injection pattern

### Mitigation:
- **Default Parameters**: Use optional dependencies with sensible defaults
- **Gradual Migration**: Refactor components as they're modified
- **Documentation**: Provide clear examples and patterns
- **Tooling**: Create helper functions for common dependency setups

## Implementation Notes

### Required Changes:
1. **Component Refactoring**: Add dependency injection to all components using browser APIs
2. **Test Updates**: Update all tests to use dependency injection pattern
3. **Global Mock Setup**: Ensure Jest setup provides consistent base mocks
4. **Documentation**: Update component documentation with dependency injection examples

### Components to Refactor:
- SettingsManager ✅ (completed)
- PopupManager (pending)
- ElementSelector (pending)
- InspectionModeManager (pending)
- Other components using chrome/document/window APIs

### Test Setup Requirements:
- Ensure global Chrome API mocks include all required methods
- Provide consistent JSDOM setup across all tests
- Create reusable dependency factory functions for tests

This decision resolves the testing challenges we encountered and establishes a sustainable pattern for future Chrome extension component development.