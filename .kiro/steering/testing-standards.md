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