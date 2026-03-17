# ADR-0007: Standardizing Authentication Flow with Modular Hooks

*   **Status**: Accepted
*   **Date**: 2026-03-07
*   **Deciders**: Antigravity, USER

## Context and Problem Statement
Previously, authentication state was managed by a monolithic `useAuth` hook in `src/hooks/useAuth.tsx` which directly coupled UI logic with the Supabase client. As part of the modularization effort (Phase 2), we need to separate the authentication logic from the state management and provide a standard way for components to consume auth data.

## Decision Drivers
*   **Separation of Concerns**: Logic (API calls) should be separate from hooks (state).
*   **Modular Architecture**: Auth should reside in its own module (`src/modules/auth`).
*   **Developer Experience**: Providing a single, consistent `useAuth` hook for all auth-related needs.

## Considered Options
1.  **Keep original hook**: Low effort but maintains coupling.
2.  **Move original hook to modules**: Better organization but doesn't solve the logic/state coupling.
3.  **Split logic into `auth.service.ts` and state into modular `useAuth.tsx`**: Follows the new architectural pattern established in Phase 1.

## Decision Outcome
*   **Chosen Option**: Option 3
*   **Rationale**: Aligning with the Modular Component Architecture, the logic for signing in/out, session hydration, and account deletion is moved to `src/modules/auth/services/auth.service.ts`. The `AuthProvider` and `useAuth` hook are migrated to `src/modules/auth/hooks/useAuth.tsx` and now leverage the service for all Supabase interactions.

### Positive Consequences
*   UI components no longer interact with Supabase directly for auth.
*   Easier testing (services can be mocked).
*   Centralized auth management within the `auth` module.

### Negative Consequences
*   Breaking changes for imports across the entire app (all pages importing `useAuth` needed updates).

## Pros and Cons of Options

### Option 3 (Chosen)
*   **Pros**: High maintainability, clear boundaries, consistent pattern.
*   **Cons**: Requires refactoring multiple files.

## Links
*   [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
*   [ADR-0003: Transition to Modular Service Pattern](./0003-transition-to-modular-service-pattern.md)
