---
inclusion: always
---

# TDD Development Workflow

## Mandatory Development Sequence

You MUST follow this exact sequence for every development task:

### Phase 1: Planning and Specification
1. **Create or refine spec** using TDD feature template
2. **Break down requirements** into testable behaviors
3. **Identify test scenarios** including edge cases
4. **Plan test data** and mock requirements
5. **Review architecture implications** and document decisions

### Phase 2: Test-First Implementation
1. **Write failing test** for first behavior
2. **Verify test fails** for the right reason
3. **Write minimal code** to make test pass
4. **Verify test passes** and no other tests break
5. **Repeat** for each behavior in the feature

### Phase 3: Refactor and Document
1. **Refactor code** while keeping tests green
2. **Update documentation** including ADRs
3. **Review test quality** and add edge cases
4. **Verify coverage metrics** meet standards
5. **Update architecture documentation**

## Workflow Enforcement Rules

### Before Writing Production Code:
- Failing test must exist
- Test must be specific to intended behavior
- Test must fail for the expected reason
- No production code without test justification

### During Implementation:
- Make minimal changes to pass tests
- Run tests after every change
- Never modify tests to accommodate production code
- Stop and fix immediately if tests break

### After Implementation:
- Refactor for code quality
- Ensure all tests still pass
- Update relevant documentation
- Verify quality gates are met

## Context Preservation

### Maintain Development Context:
- Log each TDD cycle in spec comments
- Record decisions and trade-offs made
- Update feature status in real-time
- Maintain test-to-requirement traceability
- **Monitor for recurring patterns** that could be prevented by rules

### Pattern Recognition:
- Track repeated errors or inefficiencies
- Note environment-specific issues (PowerShell vs Bash, Windows vs Unix)
- Identify code convention deviations
- Record testing anti-patterns
- Flag architecture pattern violations

### Information Handoff:
- Each development session summary
- Current TDD cycle state
- Next planned test scenarios
- Pending refactoring opportunities
- Blockers and dependencies
- **Detected patterns and proposed rules** for future prevention