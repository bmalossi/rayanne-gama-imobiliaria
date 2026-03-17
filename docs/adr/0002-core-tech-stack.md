# ADR-0002: Core Technology Stack

*   **Status**: Accepted
*   **Date**: 2026-03-07
*   **Deciders**: Antigravity, Bruno

## Context and Problem Statement
We need a modern, scalable, and developer-friendly tech stack to build a real estate platform that supports property listings, lead management, and AI-driven interactions. The priority is speed to market (productivity) without sacrificing long-term maintainability.

## Decision Drivers
*   **Developer Productivity**: Fast iteration cycles.
*   **Operational Simplicity**: Minimize the need for managing servers or complex infra.
*   **Scalability**: Robust handling of data and users.
*   **Rich UI/UX**: Support for high-end aesthetics and smooth animations.

## Considered Options
1.  **Next.js + Vercel + Prisma/PostgreSQL**: Excellent for SEO and full-stack integration, but requires managing a backend API layer.
2.  **Vite + React + Supabase (BaaS)**: Combines the speed of Vite with a powerful serverless backend (Supabase) that handles Auth, DB, and Storage out of the box.
3.  **Traditional Monolith (e.g., Laravel/Django)**: Strong ecosystem but less flexibility for the specific "high-aesthetics" frontend requirements of this project.

## Decision Outcome
*   **Chosen Option**: Vite + React 18 + TypeScript + Supabase + Tailwind CSS.
*   **Rationale**:
    - **Supabase** acts as our serverless backend, significantly reducing backend development time.
    - **Vite** provides an extremely fast development experience.
    - **Tailwind CSS + shadcn/ui** allows for the creation of "wow-factor" UIs with high maintainability.
    - **TanStack Query** manages server state efficiently.

### Positive Consequences
- Minimal boilerplate for authentication and database management.
- Real-time capabilities and storage integrated natively.
- Modern, type-safe development environment.

### Negative Consequences
- Tight coupling to Supabase ecosystem (vendor lock-in).
- Necessity of carefully managing Client-side logic to avoid "Fat Pages".

## Pros and Cons of Options

### Vite + React + Supabase
*   **Pros**: Instant backend setup, excellent DX, great for rapid prototyping and scaling.
*   **Cons**: Requires discipline in frontend architecture to avoid monolithic service files.

## Links
*   [Architecture Overview](../ARCHITECTURE.md)
*   [Database Schema](../DATABASE_SCHEMA.md)
