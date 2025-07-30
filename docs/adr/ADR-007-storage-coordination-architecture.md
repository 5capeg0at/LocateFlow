# ADR-007: Storage Coordination Architecture

Date: 2025-01-28
Status: Accepted
Deciders: LocateFlow Development Team

## Context

The LocateFlow Chrome Extension requires coordinated storage operations between multiple components (service worker, content scripts, popup) to manage user preferences and history data. The extension needs to:

1. Handle preference updates from the popup and broadcast changes to all tabs
2. Manage history data when locators are copied from content scripts
3. Provide storage statistics and cleanup functionality
4. Ensure data consistency across concurrent operations
5. Handle storage errors gracefully with proper recovery mechanisms

The implementation must follow TDD methodology and maintain separation of concerns between the service worker (coordination layer) and StorageManager (data access layer).

## Decision

We have implemented a storage coordination architecture with the following key components:

### Service Worker Storage Coordination

The ServiceWorker class acts as the central coordinator for all storage operations:

- **Message Handling**: Extends the existing message handling system to support storage operations
- **Preference Management**: Handles `updatePreferences`, `getPreferences` messages
- **History Management**: Handles `saveToHistory`, `getHistory`, `clearHistory` messages
- **Storage Statistics**: Provides `getStorageStats` for monitoring storage usage
- **Cross-Component Broadcasting**: Notifies all tabs of preference changes

### Storage Manager Integration

The service worker delegates actual storage operations to the existing StorageManager:

- **Separation of Concerns**: Service worker handles coordination, StorageManager handles data access
- **Validation**: StorageManager performs data validation before storage operations
- **Error Handling**: StorageManager throws descriptive errors that service worker catches and handles

### Message-Based Architecture

All storage operations use Chrome's message passing system:

```typescript
// Preference update message
{
  action: 'updatePreferences',
  preferences: UserPreferences
}

// History save message
{
  action: 'saveToHistory',
  locatorData: LocatorData
}
```

### Error Handling Strategy

- **Graceful Degradation**: Storage failures don't crash the extension
- **Error Logging**: All storage errors are logged with context for debugging
- **Recovery Mechanisms**: Default values returned when stored data is corrupted
- **User Feedback**: Error messages are returned to calling components

## Consequences

### Positive:

- **Centralized Coordination**: All storage operations go through the service worker, ensuring consistency
- **Cross-Component Communication**: Preference changes are automatically broadcast to all tabs
- **Robust Error Handling**: Storage failures are handled gracefully with proper recovery
- **Testable Architecture**: TDD approach ensures comprehensive test coverage (18 tests, 100% passing)
- **Separation of Concerns**: Clear boundaries between coordination and data access layers
- **Extensible Design**: Easy to add new storage operations by extending the message handling system

### Negative:

- **Message Overhead**: All storage operations require message passing, adding slight latency
- **Complexity**: Additional abstraction layer between components and storage
- **Memory Usage**: Service worker maintains StorageManager instance

### Mitigation:

- **Performance**: Message passing overhead is minimal for storage operations
- **Documentation**: Comprehensive ADR and code documentation explain the architecture
- **Testing**: Extensive test suite ensures reliability and catches regressions

## Implementation Notes

### Key Methods Added to ServiceWorker:

- `handleUpdatePreferences()`: Validates and saves user preferences, broadcasts changes
- `handleGetPreferences()`: Retrieves user preferences with fallback to defaults
- `handleSaveToHistory()`: Saves locator data to history with automatic cleanup
- `handleGetHistory()`: Retrieves history data with validation
- `handleClearHistory()`: Clears all history data
- `handleGetStorageStats()`: Provides storage usage statistics
- `broadcastPreferenceUpdate()`: Notifies all tabs of preference changes

### Message Flow:

1. Component sends storage message to service worker
2. Service worker validates message and delegates to StorageManager
3. StorageManager performs storage operation with validation
4. Service worker handles success/error responses
5. For preference updates, service worker broadcasts changes to all tabs

### Testing Strategy:

- **TDD Approach**: Tests written first, implementation follows
- **Comprehensive Coverage**: 18 test cases covering all storage operations
- **Mock Strategy**: Chrome APIs mocked to simulate various scenarios
- **Error Scenarios**: Tests include storage failures, corrupted data, and recovery
- **Concurrent Operations**: Tests verify behavior under concurrent storage operations

### Requirements Fulfilled:

- **Requirement 5.1**: Automatic history saving when locators are copied
- **Requirement 6.3**: Persisting theme preferences across browser sessions using local storage

This architecture provides a robust, testable, and maintainable foundation for storage coordination in the LocateFlow Chrome Extension.