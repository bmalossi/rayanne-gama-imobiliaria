# ADR-0006: Component Categorization (UI vs. Feature)

*   **Status**: Accepted
*   **Date**: 2026-03-07
*   **Deciders**: Antigravity, Bruno

## Context and Problem Statement
The `src/components` directory contains a mix of generic UI primitives (buttons, inputs from shadcn) and business-heavy components (PropertyCard, LeadForm). As the project grows, it becomes harder to distinguish what is an "Atomic" UI element and what is a "Feature" module.

## Decision Drivers
*   **Modularity**: Isolate features so they can be moved or deleted easily.
*   **Reusability**: Keep the UI Design System pure and independent of domain logic.

## Decision Outcome
*   **Chosen Option**: Define strict boundaries between UI Components and Feature Components.
    - **UI Components** (`src/shared/components/ui` or `src/components/ui`): Stateless, generic, and domain-agnostic.
    - **Feature Components** (`src/modules/[domain]/components`): Stateful, domain-aware, and built using UI Components.

## Pros and Cons of Options

### Positive Consequences
- High reusability of the UI kits.
- Features are self-contained (Services + Hooks + Components).
- Reduced impact of domain changes on the global design system.

### Negative Consequences
- More complex folder structure.
- Requires discipline to avoid "Logic Leakage" into the UI layer.
