# Kiro TDD Workflow Files

A comprehensive Test-Driven Development (TDD) workflow setup for Kiro AI IDE that enforces strict TDD methodology through automated steering, hooks, and specifications.

## Overview

This repository contains a complete TDD framework that:
- **Enforces TDD methodology** through automated hooks
- **Guides development workflow** with comprehensive steering files
- **Tracks patterns and learns** from development sessions
- **Maintains quality gates** with automated checks
- **Documents architecture decisions** systematically

## Quick Start

1. **Clone this repository** into your project's `.kiro` directory:
   ```bash
   git clone https://github.com/5capeg0at/kiro-tdd-workflow-files.git .kiro
   ```

2. **Start development** - The hooks will automatically enforce TDD methodology

3. **Create features** using the spec template in `.kiro/specs/locate-flow/tdd-feature-template.md`

## Structure

```
.kiro/
├── steering/           # Always-active development guidelines
│   ├── tdd-methodology.md
│   ├── development-workflow.md
│   ├── code-quality-gates.md
│   ├── architecture-decisions.md
│   └── testing-standards.md
├── hooks/              # Automated workflow enforcement
│   ├── test-first-enforcement.kiro
│   ├── pattern-recognition.kiro
│   ├── architecture-tracker.kiro
│   ├── documentation-generator.kiro
│   └── regression-detection.kiro
├── specs/              # Feature development templates
│   └── locate-flow/
│       ├── tdd-feature-template.md
│       └── pattern-rules/
└── settings/           # Kiro configuration
    └── mcp.json
```

## Key Features

### 🔴 Red-Green-Refactor Enforcement
- **Prevents production code** without corresponding tests
- **Validates test-first** approach before allowing saves
- **Tracks TDD cycles** in feature specifications

### 📊 Quality Gates
- **90% minimum test coverage** requirement
- **Complexity metrics** monitoring
- **Code quality checks** before commits
- **Documentation standards** enforcement

### 🧠 Pattern Recognition
- **Learns from mistakes** and suggests new rules
- **Detects recurring issues** across development sessions
- **Generates proposed rules** for common problems
- **Environment-specific guidance** (Windows/PowerShell focus)

### 📋 Structured Development
- **Feature specification templates** with TDD cycle tracking
- **Architecture decision recording** (ADR) templates
- **Test scenario planning** and documentation
- **Implementation progress tracking**

## Steering Files

### Core TDD Methodology (`tdd-methodology.md`)
- Red-Green-Refactor cycle enforcement
- Test quality requirements
- Code coverage standards
- Anti-pattern prevention

### Development Workflow (`development-workflow.md`)
- Mandatory development sequence
- Context preservation rules
- Pattern recognition guidelines
- Information handoff protocols

### Code Quality Gates (`code-quality-gates.md`)
- Pre-commit requirements
- Automated quality checks
- Refactoring standards
- Quality metrics tracking

### Architecture Decisions (`architecture-decisions.md`)
- ADR documentation templates
- SOLID principles enforcement
- Domain-driven design guidelines
- Testing architecture standards

### Testing Standards (`testing-standards.md`)
- File-specific testing conventions
- Test organization patterns
- Assertion guidelines
- Mock strategy recommendations

## Hooks

### Test-First Enforcement
Prevents saving production code without corresponding tests. Validates TDD methodology compliance before allowing file saves.

### Pattern Recognition
Analyzes interactions for recurring issues and automatically generates proposed rules to prevent future problems.

### Architecture Tracker
Monitors architectural decisions and ensures consistency with established patterns.

### Documentation Generator
Automatically updates documentation based on code changes and architectural decisions.

### Regression Detection
Identifies potential regressions and ensures test coverage for critical paths.

## Usage Examples

### Starting a New Feature
1. Copy the TDD feature template: `.kiro/specs/locate-flow/tdd-feature-template.md`
2. Fill in requirements and test scenarios
3. Begin TDD cycles - hooks will enforce methodology
4. Track progress in the spec document

### Handling Recurring Issues
The pattern recognition hook will automatically:
- Detect repeated problems
- Log them in `pattern-rules/detected-patterns.md`
- Propose solutions in `pattern-rules/proposed-rules.md`
- Suggest steering file updates

## Customization

### Adding New Steering Rules
Create new `.md` files in `.kiro/steering/` with:
```markdown
---
inclusion: always  # or fileMatch, manual
fileMatchPattern: "**/*.ts"  # if using fileMatch
---

# Your Rule Content
```

### Creating Custom Hooks
Add `.kiro` files in `.kiro/hooks/` following the existing patterns.

### MCP Integration
Configure Model Context Protocol servers in `.kiro/settings/mcp.json` for additional tooling.

## Benefits

- **Enforced Discipline**: Impossible to skip TDD phases
- **Learning System**: Gets smarter with each project
- **Quality Assurance**: Automated quality gates prevent technical debt
- **Knowledge Capture**: Documents decisions and patterns
- **Reusable Framework**: Drop into any new project

## Requirements

- Kiro AI IDE
- Git configured with your credentials
- PowerShell (Windows) or Bash (Unix) environment

## Contributing

This is a personal workflow template, but feel free to fork and adapt for your own needs.

## License

MIT License - Use freely for your own projects.