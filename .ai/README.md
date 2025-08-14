# Project Context for AI Agents

This directory contains comprehensive context files for AI development assistants working on the SIH Solver's Compass project.

## Files Overview

### `.github/copilot-instructions.md`
GitHub Copilot-specific instructions with:
- Code style guidelines and patterns
- Component architecture examples
- Testing patterns and best practices
- Development workflow instructions
- Security and performance considerations

### `gemini-context.md`
Comprehensive project context for Gemini CLI and other AI agents:
- Complete project mission and technical architecture
- Detailed implementation patterns for all core features
- Database schema and data model specifications
- Design system and UI guidelines
- Error handling and testing strategies
- Deployment and operational considerations

## Usage

### For GitHub Copilot
The instructions in `.github/copilot-instructions.md` are automatically loaded by GitHub Copilot when working in this repository, providing context-aware code suggestions.

### For Gemini CLI
Use the comprehensive context file with Gemini CLI:
```bash
# Set context for current session
gemini config set context-file .ai/gemini-context.md

# Or reference in specific queries
gemini ask --context .ai/gemini-context.md "How should I implement the search functionality?"
```

### For Other AI Agents
Both files can be referenced by other AI development tools to provide detailed project understanding and ensure consistent development patterns.

## Maintenance

These context files should be updated when:
- New features are added or existing features are significantly modified
- Architecture decisions change
- New development patterns or best practices are adopted
- Dependencies or technology stack components are updated

The files are designed to provide AI agents with comprehensive understanding of the project's goals, architecture, implementation patterns, and development standards.
