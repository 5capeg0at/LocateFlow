---
inclusion: always
---

# Code Quality Gates

## Pre-Commit Requirements

ALL code changes must pass these gates before being accepted:

### 1. Test Coverage Gate
- Minimum 90% line coverage
- No decrease in overall coverage
- All new public methods tested
- Critical paths have 100% coverage

### 2. Code Quality Metrics
- Cyclomatic complexity < 10 per method
- No duplicate code blocks > 6 lines
- No methods longer than 30 lines
- No classes with > 20 methods

### 3. Static Analysis
- No linting errors or warnings
- Type safety verification (TypeScript)
- Security vulnerability scan passes
- No code smells flagged

### 4. Documentation Standards
- All public APIs documented
- Architecture decisions recorded
- README updated for new features
- Inline comments for complex logic

## Automated Quality Checks

### Pre-Save Hooks Must Verify:
1. Tests exist for any new production code
2. All tests pass before code changes
3. Linting and formatting applied
4. Import statements optimized

### Post-Save Hooks Must Execute:
1. Full test suite execution
2. Coverage report generation
3. Documentation updates
4. Architecture decision validation

## Refactoring Standards

### Safe Refactoring Rules:
- All tests must remain green throughout
- No behavior changes during refactoring
- Incremental changes with frequent test runs
- Revert immediately if tests break

### Refactoring Triggers:
- Code duplication detected
- Complexity metrics exceeded
- Test maintenance becomes difficult
- New requirements don't fit cleanly

## Quality Metrics Tracking

### Monitor These Metrics:
- Test execution time trends
- Code coverage trends
- Defect rates per component
- Time spent on bug fixes vs features
- Technical debt accumulation