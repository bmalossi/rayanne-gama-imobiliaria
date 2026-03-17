# ADR-0003: Transition to Modular Service Pattern

*   **Status**: Accepted (Supersedes ADR-0002)
*   **Date**: 2026-03-07
*   **Deciders**: Antigravity, Bruno

## Context and Problem Statement
The current `src/services/api.ts` file is a monolithic implementation handling multiple domains (Properties, Leads, Profile, AI Chatbot). At 500+ lines, it's difficult to navigate, test, and scale. New features will inevitably bloat this file further, creating a "God Object" anti-pattern.

## Decision Drivers
*   **Maintainability**: Code should be organized by domain for easier discovery.
*   **Scalability**: New modules should be easy to add without touching global files.
*   **Testability**: Small, scoped service files are easier to unit test.

## Considered Options
1.  **Status Quo (Monolithic `api.ts`)**: Low initial overhead but high long-term maintenance cost.
2.  **Layered Services (e.g., `FetchService`, `StorageService`)**: Organizes by technical role, but logic remains scattered across domains.
3.  **Domain-Specific Modular Services**: Each domain (e.g., Properties) has its own service file.

## Decision Outcome
*   **Chosen Option**: Domain-Specific Modular Services.
*   **Rationale**: Aligning code structure with business domains (Properties, Leads, Auth) provides clear boundaries and reduces the blast radius of changes.

### Positive Consequences
- Files are smaller and focused (Single Responsibility Principle).
- Easier for multiple developers (or AI agents) to work on different features simultaneously.
- Clearer dependency graph.

### Negative Consequences
- Slightly more initial effort to move code and update imports.
- More files in the directory tree.

## Links
*   [Architecture Documentation](../ARCHITECTURE.md)
