# ADR-0002: Modular Development Strategy

*   **Status**: Accepted
*   **Date**: 2026-03-07
*   **Deciders**: Antigravity, Bruno

## Context and Problem Statement
The current implementation relies on a monolithic `api.ts` file and "Fat Pages" with mixed responsibilities. This is becoming difficult to scale and test.

## Decision Drivers
- Maintainability: Code should be easy to find and modify.
- Testability: Domain logic should be isolated from UI.
- Reusability: Common data patterns should be reusable across pages.

## Decision Outcome
*   **Chosen Option**: Transition to a Modular Feature Architecture.
*   **Rationale**: Scaling requires clear boundaries. Organizing code by domain (Properties, Leads, Auth) scales better than organizing by technical layer alone.

### Positive Consequences
- Each feature has its own folder containing its specific services, hooks, and components.
- Components become thinner and more declarative.
- Easier to implement unit tests for isolated domain logic.

### Negative Consequences
- Initial refactoring effort required to decompose `api.ts`.
- Slightly more complex folder nesting.
