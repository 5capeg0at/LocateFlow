---
inclusion: always
---

# Chrome Extension Testing Guide

## Overview

This guide provides specific patterns and practices for testing Chrome extension components, based on lessons learned from challenging testing scenarios.

## Common Testing Challenges

### 1. Global API Dependencies
**Problem**: Chrome extension components often depend on global APIs (chrome, document, window) that are difficult to mock consistently.

**Solution**: Use dependency injection pattern:
```typescript
// ❌ Hard to test
class Component {
    doSomething() {
        chrome.storage.local.get(['data']);
        document.getElementById('element');
    }
}

// ✅ Easy to test
class Component {
    constructor(private dependencies: ComponentDependencies = {}) {
        this.chrome = dependencies.chrome || chrome;
        this.document = dependencies.document || document;
    }
    
    doSomething() {
        this.chrome.storage.local.get(['data']);
        this.document.getElementById('element');
    }
}
```

### 2. Global Mock Conflicts
**Problem**: Jest setup files can override test-specific mocks, causing unexpected behavior.

**Solution**: 
- Ensure global setup includes all required Chrome API methods
- Use dependency injection to avoid relying on global mocks
- Clear module cache when necessary for fresh imports

### 3. JSDOM Environment Issues
**Problem**: DOM operations may not work correctly in test environment.

**Solution**:
```typescript
// Test setup
beforeEach(() => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>...</body></html>`);
    const document = dom.window.document;
    const window = dom.window as unknown as Window;
    
    // Use dependency injection
    const component = new Component({ document, window, chrome: mockChrome });
});
```

## Testing Patterns

### 1. Component Testing with Dependencies
```typescript
describe('ComponentName', () => {
    let mockChrome: any;
    let testDocument: Document;
    let testWindow: Window;
    
    beforeEach(() => {
        // Setup test environment
        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
        testDocument = dom.window.document;
        testWindow = dom.window as unknown as Window;
        
        mockChrome = {
            storage: {
                local: {
                    get: jest.fn(),
                    set: jest.fn()
                }
            },
            runtime: {
                openOptionsPage: jest.fn()
            }
        };
    });
    
    test('should work correctly', () => {
        const component = new Component({
            document: testDocument,
            window: testWindow,
            chrome: mockChrome
        });
        
        // Test with controlled dependencies
        component.doSomething();
        
        expect(mockChrome.storage.local.get).toHaveBeenCalled();
    });
});
```

### 2. Chrome API Mocking
```typescript
// Complete Chrome API mock structure
const createMockChrome = () => ({
    storage: {
        local: {
            get: jest.fn().mockResolvedValue({}),
            set: jest.fn().mockResolvedValue(undefined),
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
});
```

### 3. DOM Testing
```typescript
test('should manipulate DOM correctly', () => {
    // Create test DOM with required elements
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <body>
            <button id="test-button">Click me</button>
            <div id="result"></div>
        </body>
        </html>
    `);
    
    const component = new Component({
        document: dom.window.document
    });
    
    component.handleButtonClick();
    
    const result = dom.window.document.getElementById('result');
    expect(result?.textContent).toBe('Button clicked');
});
```

## Best Practices

### 1. Dependency Injection Setup
- Always provide default fallbacks to global objects
- Use optional dependencies with sensible defaults
- Create reusable dependency factory functions

### 2. Test Environment
- Use JSDOM for DOM testing
- Create fresh instances for each test
- Clear mocks between tests

### 3. Mock Management
- Keep mocks simple and focused
- Use factory functions for complex mock setups
- Ensure global setup covers all required APIs

### 4. Error Handling Testing
```typescript
test('should handle Chrome API errors gracefully', async () => {
    const mockChrome = {
        storage: {
            local: {
                get: jest.fn().mockRejectedValue(new Error('Storage error'))
            }
        }
    };
    
    const component = new Component({ chrome: mockChrome });
    
    // Should not throw, should handle gracefully
    await expect(component.loadData()).resolves.not.toThrow();
});
```

## Troubleshooting Common Issues

### Issue: "chrome.runtime.openOptionsPage is not a function"
**Cause**: Global Chrome mock doesn't include the required method
**Solution**: Add the method to global Jest setup or use dependency injection

### Issue: "document.body is null"
**Cause**: JSDOM not properly set up
**Solution**: Ensure JSDOM includes proper HTML structure

### Issue: Tests are flaky or interfere with each other
**Cause**: Shared global state or module caching
**Solution**: Use dependency injection and clear module cache when needed

### Issue: Mock not being called as expected
**Cause**: Component using global object instead of injected dependency
**Solution**: Verify dependency injection is working correctly

## Migration Checklist

When refactoring existing components for better testability:

- [ ] Add dependency injection interface
- [ ] Update constructor to accept dependencies
- [ ] Replace global object usage with injected dependencies
- [ ] Update all tests to use dependency injection
- [ ] Verify all Chrome API methods are mocked
- [ ] Test error handling scenarios
- [ ] Update component documentation

This guide should help prevent the testing challenges we encountered and establish consistent patterns for Chrome extension testing.