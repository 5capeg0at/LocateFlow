---
inclusion: always
---

# Architecture Decisions Record (ADR)

## Decision Documentation Requirements

Every architectural decision MUST be documented using this template:

### ADR Template:
```markdown
# ADR-XXXX: [Title]

Date: YYYY-MM-DD
Status: [Proposed | Accepted | Deprecated | Superseded]
Deciders: [List of decision makers]

## Context
[Describe the problem and constraints]

## Decision
[State the chosen solution]

## Consequences
### Positive:
- [List benefits]

### Negative:
- [List drawbacks and risks]

### Mitigation:
- [How to address negative consequences]

## Implementation Notes
[Technical details and implementation guidance]
```

## Architectural Principles

### SOLID Principles Enforcement:
- **Single Responsibility**: Each class/module has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Clients shouldn't depend on unused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

### Domain-Driven Design:
- Model business domain explicitly
- Use ubiquitous language consistently
- Maintain clear bounded contexts
- Separate domain logic from infrastructure

### Testing Architecture:
- Dependency injection for testability
- Clear separation of concerns
- Testable interfaces and abstractions
- Isolated unit test targets

## Code Organization Standards

### Layer Responsibilities:
- **Presentation**: UI components, controllers
- **Application**: Use cases, orchestration
- **Domain**: Business logic, entities
- **Infrastructure**: Data access, external services

### Dependency Rules:
- Dependencies point inward only
- Inner layers don't know about outer layers
- Use dependency injection at boundaries
- Abstract external dependencies with interfaces