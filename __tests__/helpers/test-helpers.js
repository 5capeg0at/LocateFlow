/**
 * Test Helper Utilities for Chrome Extension Testing
 * 
 * Provides utilities for mocking DOM elements and Chrome APIs
 * in a test environment following TDD principles.
 */

const { JSDOM } = require('jsdom');

/**
 * Creates a mock HTMLElement with specified tag and attributes
 * @param {string} tagName - The HTML tag name
 * @param {Object} attributes - Key-value pairs of attributes
 * @returns {HTMLElement} Mock HTML element
 */
function createMockElement(tagName, attributes = {}) {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const element = dom.window.document.createElement(tagName);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'class') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });

    return element;
}

/**
 * Creates a mock DOM structure from a configuration object
 * @param {Object} structure - DOM structure configuration
 * @returns {Document} Mock document
 */
function createMockDOM(structure) {
    const dom = new JSDOM('<!DOCTYPE html>');
    const document = dom.window.document;

    function createElement(config) {
        const element = document.createElement(config.tagName);

        if (config.attributes) {
            Object.entries(config.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }

        if (config.children) {
            config.children.forEach(childConfig => {
                const child = createElement(childConfig);
                element.appendChild(child);
            });
        }

        return element;
    }

    const rootElement = createElement(structure);
    document.replaceChild(rootElement, document.documentElement);

    return document;
}

/**
 * Sets up JSDOM environment for testing
 */
function setupDOMEnvironment() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable'
    });

    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;
    global.Node = dom.window.Node;
    global.location = dom.window.location;
}

/**
 * Cleans up DOM environment after tests
 */
function cleanupDOMEnvironment() {
    if (global.window && global.window.close) {
        global.window.close();
    }
    // Keep globals defined but reset document
    if (global.document) {
        global.document.body.innerHTML = '';
    }
}

/**
 * Mocks Chrome extension APIs
 * @param {string} apiPath - Dot-separated path to the API (e.g., 'storage.local')
 * @param {Object} mockMethods - Object containing mock methods
 */
function mockChromeAPI(apiPath, mockMethods) {
    if (!global.chrome) {
        global.chrome = {};
    }

    const pathParts = apiPath.split('.');
    let current = global.chrome;

    // Navigate to the parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
    }

    // Set the final API object
    const finalKey = pathParts[pathParts.length - 1];
    current[finalKey] = mockMethods;
}

module.exports = {
    createMockElement,
    createMockDOM,
    setupDOMEnvironment,
    cleanupDOMEnvironment,
    mockChromeAPI
};