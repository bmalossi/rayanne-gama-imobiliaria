# ADR-0005: Centralized Configuration Management

*   **Status**: Accepted
*   **Date**: 2026-03-07
*   **Deciders**: Antigravity, Bruno

## Context and Problem Statement
Configuration values like WhatsApp numbers, map URLs, and branding constants are currently hardcoded inside page components (`Home.tsx`, `PropertyDetail.tsx`). This makes updates risky (missing a reference) and logic hard to reuse across different contact points.

## Decision Drivers
*   **Maintainability**: Single source of truth for all global constants.
*   **Consistency**: Ensure the same phone number or link is used everywhere.
*   **Flexibility**: Easy to swap values for different environments or white-labeling.

## Decision Outcome
*   **Chosen Option**: Create a central configuration layer in `src/shared/config`.
*   **Rationale**: A dedicated config object (e.g., `SITE_CONFIG`) allows us to manage all external integrations and brand-specific values in one place, providing helper methods (like link generators) for complex constants.

### Positive Consequences
- Updates carry through the entire application instantly.
- Cleaner component code.
- Safer management of environment-specific overflows.

### Negative Consequences
- Components depend on a global object.
