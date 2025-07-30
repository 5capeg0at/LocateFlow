---
inclusion: fileMatch
fileMatchPattern: "**/*.{test,spec}.{js,ts,tsx,jsx}"
---

# Testing Standards and Conventions

## Test File Organization

### Naming Conventions:
- Unit tests: `ComponentName.test.ts`
- Integration tests: `FeatureName.integration.test.ts`
- E2E tests: `UserFlow.e2e.test.ts`

### Directory Structure:
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── Button.stories.tsx
│   └── __tests__/
│       └── integration/
└── __tests__/
    └── e2e/
```

## Test Structure Standards

### Use Describe-It Pattern:
```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should behavior expectation', () => {
      // Arrange
      // Act  
      // Assert
    });
  });
});
```

### Test Data Management:
- Use factories for test data creation
- Keep test data minimal and focused
- Use descriptive variable names in tests
- Create reusable test utilities

## Assertion Guidelines

### Preferred Assertion Style:
```typescript
// Good - Specific and descriptive
expect(result.status).toBe('success');
expect(result.data).toHaveLength(3);
expect(mockFunction).toHaveBeenCalledWith(expectedParams);

// Bad - Vague or implementation-focused
expect(result).toBeTruthy();
expect(component.state.loading).toBe(false);
```

## Mock Strategy

### Mock External Dependencies:
- API calls and HTTP requests
- File system operations
- Third-party libraries
- System time and dates

### Don't Mock:
- Internal modules being tested
- Simple utility functions
- Language built-ins

## Performance Standards

- Unit tests must run in under 100ms each
- Integration tests under 1 second each
- Full test suite under 30 seconds
- Use beforeAll/afterAll for expensive setup
## C
hrome Extension Testing Standards

### Dependency Injection Requirements:
- All components interacting with browser APIs MUST use dependency injection
- Components MUST provide default fallbacks to global objects
- Tests MUST use dependency injection to control external dependencies

### Chrome API Mocking:
```typescript
// Required Chrome API mock structure
const mockChrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            clear: jest.fn(),
            remove: jest.fn()
        }
    },
    runtime: {
        sendMessage: jest.fn(),
        openOptionsPage: jest.fn(),
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        }
    },
    tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
    }
};
```

### DOM Testing Standards:
- Use JSDOM for DOM manipulation tests
- Create fresh DOM instances for each test
- Include required HTML structure in test setup
- Use dependency injection for document/window objects

### Test Environment Setup:
```typescript
beforeEach(() => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>...</body></html>`);
    const component = new Component({
        document: dom.window.document,
        window: dom.window as unknown as Window,
        chrome: mockChrome
    });
});
```

### Error Handling Testing:
- MUST test Chrome API error scenarios
- MUST verify graceful degradation
- MUST test storage quota exceeded scenarios
- MUST test network failure scenarios

### Anti-Patterns to Avoid:
- Relying on global mocks in component code
- Testing implementation details instead of behavior
- Sharing state between tests
- Complex test setup that obscures test intent
- Mocking internal modules being tested