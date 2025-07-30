/**
 * Jest Setup Configuration
 * 
 * Global test environment setup for Chrome extension testing
 */

// Polyfills for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { setupDOMEnvironment, mockChromeAPI } = require('./helpers/test-helpers');

// Setup DOM environment before each test
beforeEach(() => {
  setupDOMEnvironment();

  // Setup basic Chrome API mocks
  mockChromeAPI('runtime', {
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
    getManifest: jest.fn().mockReturnValue({}),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  });

  mockChromeAPI('storage.local', {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    remove: jest.fn(),
    getBytesInUse: jest.fn()
  });

  mockChromeAPI('tabs', {
    query: jest.fn(),
    sendMessage: jest.fn()
  });
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});