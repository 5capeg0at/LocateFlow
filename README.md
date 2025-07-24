# LocateFlow Chrome Extension

A Chrome Extension for real-time web element inspection and accurate locator generation. Built with Test-Driven Development (TDD) methodology and Manifest V3 compliance.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Chrome browser for testing

### Installation
```bash
npm install
```

### Development Commands
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for TDD
npm run test:watch

# Build TypeScript
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🧪 Testing Framework

This project follows strict Test-Driven Development (TDD) methodology:

### TDD Workflow
1. **RED**: Write failing test that describes desired behavior
2. **GREEN**: Write minimal code to make test pass  
3. **REFACTOR**: Improve code structure while keeping tests green

### Testing Utilities
Located in `__tests__/helpers/test-helpers.js`:

```javascript
// DOM Testing
const element = createMockElement('div', { id: 'test', class: 'example' });
const document = createMockDOM({ tagName: 'html', children: [...] });

// Chrome API Testing
mockChromeAPI('storage.local', {
  get: jest.fn(),
  set: jest.fn()
});

// Environment Setup
setupDOMEnvironment();  // Before tests
cleanupDOMEnvironment(); // After tests
```

### Quality Standards
- **Minimum 90% line coverage**
- **85% branch coverage required**
- **All public methods must have tests**
- **ESLint compliance mandatory**
- **TypeScript strict mode enforced**

## 📁 Project Structure

```
├── src/
│   ├── content/          # Content scripts
│   ├── background/       # Service worker scripts
│   ├── popup/           # Extension popup UI
│   ├── options/         # Options page
│   └── shared/          # Shared utilities
├── __tests__/
│   ├── helpers/         # Testing utilities
│   └── setup.js         # Global test configuration
├── docs/
│   ├── adr/            # Architecture Decision Records
│   └── implementation-context.md
├── manifest.json        # Chrome extension manifest
├── package.json
├── tsconfig.json
├── jest.config.js
└── .eslintrc.js
```

## 🏗️ Architecture

### Chrome Extension Components
- **Manifest V3**: Service worker architecture
- **Content Scripts**: DOM inspection and interaction
- **Background Service Worker**: Extension lifecycle management
- **Popup UI**: Main extension interface
- **Options Page**: User preferences and settings

### Core Systems Implemented
- **Data Models** (`src/shared/data-models.ts`): TypeScript interfaces with validation
- **Error Handler** (`src/shared/error-handler.ts`): Centralized error management
- **Test Framework**: Comprehensive TDD utilities and Chrome API mocks

### Key Design Principles
- **Test-First Development**: No production code without failing tests
- **Modular Architecture**: Clear separation of concerns
- **Type Safety**: TypeScript with strict configuration
- **Quality Gates**: Automated linting and testing
- **Graceful Failure**: Error handling that never crashes the browser

## 📋 Requirements Implementation

### Functional Requirements Status
- [ ] Real-time element inspection and locator generation
- [ ] Interactive on-page locator UI
- ✅ **Detailed confidence scoring**: Data models and interfaces implemented
- [ ] Accessibility (ARIA) analysis
- [ ] Locator history in main extension popup
- ✅ **Customizable user preferences**: Data models and validation implemented
- [ ] Client-side privacy

### Non-Functional Requirements Status
- ✅ **Platform Compatibility**: Manifest V3 compliance implemented
- ✅ **Error Handling**: Comprehensive error categorization and graceful failure system

## 🔧 Development Guidelines

### Before Writing Production Code
1. Write a failing test that describes the desired behavior
2. Verify the test fails for the right reason
3. Write minimal code to make the test pass
4. Refactor while keeping tests green

### Code Quality Requirements
- All changes must pass ESLint validation
- TypeScript compilation must succeed without errors
- Test coverage must not decrease below thresholds
- All tests must pass before committing

### Chrome Extension Testing
- Use provided Chrome API mocks for testing extension functionality
- Test DOM manipulation with JSDOM utilities
- Mock external dependencies appropriately
- Test both success and error scenarios

## 📚 Documentation

### Architecture Decision Records
- **ADR-001**: [Project Structure and Testing Framework](docs/adr/ADR-001-project-structure-and-testing.md)
- **ADR-002**: [Data Models Architecture](docs/adr/ADR-002-data-models-architecture.md)
- **ADR-003**: [Error Handling System](docs/adr/ADR-003-error-handling-system.md)

### Development Documentation
- **Implementation Context**: [Complete TDD development history](docs/implementation-context.md)
- **Spec Documents**: Located in `.kiro/specs/locateflow-chrome-extension/`

## 🚦 Development Progress

### ✅ Completed Tasks (TDD Methodology)
1. **Project Structure Setup** - Chrome extension foundation with Manifest V3
2. **Data Models & Interfaces** - TypeScript interfaces with comprehensive validation
3. **Error Handling System** - Centralized error management with graceful failure

### 📊 Current Metrics
- **Test Coverage**: 98%+ across all modules
- **Tests Passing**: 46/46 tests
- **Code Quality**: ESLint compliant, TypeScript strict mode
- **Architecture**: 3 ADRs documenting key decisions

### 🎯 Next Development Tasks
1. **Storage Manager** - Chrome storage wrapper with TDD approach
2. **Locator Engine** - CSS/XPath generation algorithms
3. **Content Script System** - DOM inspection and interaction
4. **UI Components** - Popup and options page implementation

See `.kiro/specs/locateflow-chrome-extension/tasks.md` for detailed implementation plan.

## 🤝 Contributing

This project follows TDD methodology. All contributions must:
1. Include comprehensive tests
2. Maintain or improve code coverage
3. Pass all quality gates
4. Follow established architecture patterns

For detailed development context, see [implementation-context.md](docs/implementation-context.md).