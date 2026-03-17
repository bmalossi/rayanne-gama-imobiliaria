# ADR-0004: Standardizing Data Fetching with Scoped Hooks

*   **Status**: Accepted
*   **Date**: 2026-03-07
*   **Deciders**: Antigravity, Bruno

## Context and Problem Statement
Pages currently call `useQuery` or `useMutation` directly, passing service functions in-line. This spreads data-fetching configuration (query keys, stale times, error handling) across components, making consistent caching strategies and logic reuse difficult.

## Decision Drivers
*   **Dryness (Don't Repeat Yourself)**: Query logic for a specific entity should live in one place.
*   **Component Purity**: Components should focus on UI, not on the mechanics of fetching data.
*   **Developer Experience**: Reusing a `useProperty(id)` hook is easier than re-implementing `useQuery`.

## Decision Outcome
*   **Chosen Option**: Encapsulate all data operations in Module-Scoped Custom Hooks.
*   **Rationale**: By creating hooks like `useProperties` in `src/modules/[domain]/hooks`, we centralize the data management logic and provide a cleaner API for the presentation layer.

### Positive Consequences
- Consistent `queryKey` management across the app.
- Components become thinner and more declarative.
- Centralized place to implement optimistic updates or complex cache invalidation.

### Negative Consequences
- An extra layer of abstraction.
- Need to sync hooks with service changes.
