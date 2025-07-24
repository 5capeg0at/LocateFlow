---
inclusion: always
---

# Test-Driven Development Methodology

## Core TDD Principles

You MUST follow the Red-Green-Refactor cycle for ALL code changes:

1. **RED**: Write a failing test that describes the desired behavior
2. **GREEN**: Write the minimal code to make the test pass
3. **REFACTOR**: Improve code structure while keeping tests green

## Strict TDD Rules

### BEFORE writing ANY production code:
- A failing test MUST exist that justifies the code
- Tests must be specific and test only one behavior
- Test names must clearly describe the expected behavior
- No production code without a corresponding failing test

### Test Quality Requirements:
- Each test must be independent and isolated
- Tests must be deterministic (same input = same output)
- Use Arrange-Act-Assert pattern consistently
- Mock external dependencies appropriately
- Test edge cases and error conditions

### Code Coverage Standards:
- Minimum 90% line coverage for all new code
- 100% coverage for critical business logic
- Branch coverage must exceed 85%
- All public methods must have corresponding tests

## TDD Cycle Enforcement

The AI agent MUST:
1. Always start with test creation
2. Refuse to write production code without failing tests
3. Run tests after each change
4. Immediately fix any broken tests before proceeding
5. Refactor only when all tests are green

## Anti-Patterns to Avoid

- Writing production code before tests
- Modifying tests to make production code pass (unless requirements changed)
- Skipping refactor phase
- Writing multiple behaviors in single test
- Testing implementation details instead of behavior