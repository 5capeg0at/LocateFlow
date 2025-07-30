---
inclusion: manual
---

# Testing Troubleshooting Guide

## Common Chrome Extension Testing Issues

### 1. "chrome.runtime.openOptionsPage is not a function"

**Symptoms:**
- TypeError when calling Chrome API methods
- Tests failing with "is not a function" errors

**Root Cause:**
- Global Chrome mock in Jest setup doesn't include the required method
- Component using global chrome object instead of injected dependency

**Solutions:**
1. **Add missing method to global setup** (`__tests__/setup.js`):
```javascript
mockChromeAPI('runtime', {
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(), // ← Add missing method
    onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
    }
});
```

2. **Use dependency injection in component**:
```typescript
// Instead of: chrome.runtime.openOptionsPage()
// Use: this.chrome.runtime.openOptionsPage()
```

### 2. "document.body is null" or DOM manipulation fails

**Symptoms:**
- Tests failing when trying to manipulate DOM elements
- Elements not found by getElementById

**Root Cause:**
- JSDOM not properly set up with required HTML structure
- Component using global document instead of injected dependency

**Solutions:**
1. **Proper JSDOM setup**:
```typescript
const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <body>
        <!-- Include required elements -->
        <button id="required-button">Click</button>
    </body>
    </html>
`);
```

2. **Use dependency injection**:
```typescript
const component = new Component({
    document: dom.window.document
});
```

### 3. Tests are flaky or interfere with each other

**Symptoms:**
- Tests pass individually but fail when run together
- Inconsistent test results
- Global state pollution

**Root Cause:**
- Shared global state between tests
- Module caching issues
- Mocks not being reset properly

**Solutions:**
1. **Clear module cache**:
```typescript
beforeEach(() => {
    Object.keys(require.cache).forEach(key => {
        if (key.includes('component-name')) {
            delete require.cache[key];
        }
    });
});
```

2. **Use dependency injection** to avoid global state
3. **Reset mocks properly**:
```typescript
beforeEach(() => {
    jest.clearAllMocks();
});
```

### 4. "Expected theme class to be applied but it wasn't"

**Symptoms:**
- DOM assertions failing even though code appears correct
- Classes not being applied to elements

**Root Cause:**
- Component working on different document instance than test is checking
- Global document vs injected document mismatch

**Solutions:**
1. **Ensure consistent document usage**:
```typescript
// Component should use injected document
this.document.body.classList.add('theme-class');

// Test should check same document
expect(testDocument.body.classList.contains('theme-class')).toBe(true);
```

2. **Debug with logging**:
```typescript
console.log('Component document:', !!this.document);
console.log('Test document:', !!testDocument);
console.log('Same instance:', this.document === testDocument);
```

### 5. "matchMedia is not a function"

**Symptoms:**
- Tests failing when component tries to detect system theme
- window.matchMedia undefined errors

**Root Cause:**
- JSDOM doesn't provide matchMedia by default
- Component using global window instead of injected dependency

**Solutions:**
1. **Mock matchMedia in test**:
```typescript
const mockMatchMedia = jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
});
```

2. **Use dependency injection**:
```typescript
const component = new Component({
    window: windowWithMatchMedia
});
```

## Debugging Strategies

### 1. Isolate the Problem
- Run single test to eliminate interference
- Add console.log statements to trace execution
- Check if global vs injected dependencies are being used

### 2. Verify Mock Setup
- Log mock objects to ensure they have required methods
- Check if mocks are being called as expected
- Verify mock return values match expectations

### 3. Check Environment Setup
- Ensure JSDOM includes required HTML structure
- Verify global mocks are properly configured
- Check if module caching is causing issues

### 4. Use Dependency Injection Debugging
```typescript
// Add to component constructor for debugging
console.log('Dependencies:', {
    hasDocument: !!this.document,
    hasWindow: !!this.window,
    hasChrome: !!this.chrome,
    chromeRuntime: !!this.chrome?.runtime,
    chromeStorage: !!this.chrome?.storage
});
```

## Prevention Checklist

When creating new Chrome extension components:

- [ ] Use dependency injection for all external dependencies
- [ ] Provide default fallbacks to global objects
- [ ] Create comprehensive test setup with all required mocks
- [ ] Test error scenarios and edge cases
- [ ] Verify DOM manipulation works correctly
- [ ] Check that Chrome API methods are properly mocked
- [ ] Ensure tests are isolated and don't share state
- [ ] Document any special testing requirements

## Quick Reference Commands

```bash
# Run single test file
npm test -- ComponentName.test.ts

# Run tests with verbose output
npm test -- --verbose

# Run tests in watch mode
npm test -- --watch

# Clear Jest cache
npm test -- --clearCache
```

This troubleshooting guide should help quickly identify and resolve common testing issues in Chrome extension development.