# Architecture Documentation

## Overview
This platform is a real estate management system built with a **Serverless-first Frontend Monolith** approach, leveraging **React** for the user interface and **Supabase** as the Backend-as-a-Service (BaaS).

## Tech Stack
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + Framer Motion (animations)
- **State Management**: TanStack Query (Server State) + React Context/Hooks (Local State)
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Routing**: React Router DOM v6

## System Components

### 1. Presentation Layer (`src/pages`)
Contains the top-level route targets.
- **Public**: Home, Listings, Property Detail, Auth (Login/Register).
- **Dashboard**: Protected management area for properties and leads.

### 2. Component Layer (`src/components`)
- **UI Components**: Atomic shadcn/ui components (`src/components/ui`).
- **Feature Components**: Domain-specific components like `PropertyCard`, `LeadForm`, and `AIChatbot`.

### 3. Service Layer (`src/services` & `src/modules/*/services`)
- **Legacy**: Monolithic `api.ts` handling diverse responsibilities.
- **Modern (Target)**: Domain-specific services (e.g., `src/modules/properties/services/property.service.ts`).

### 4. Configuration & SEO Layer (`src/shared`)
- Centralized source of truth for site branding, social links, and global settings (`src/shared/config/site.ts`).
- **SEO & GEO Layer**: Component `SEOHead.tsx` utiliza `react-helmet-async` e JSON-LD para compor schemas estendidos (`RealEstateAgent`, `Product`, `Offer`) para Crawlers de IA focando em Generative Engine Optimization.

### 5. Data Layer (Supabase)
- **PostgreSQL**: Relational storage with Row Level Security (RLS).
- **Storage**: Buckets for property images and user avatars.
- **Edge Functions**: Specialized logic like the `chatbot-ai`.

## Data Flow
1. **Request**: UI triggers a query/mutation via TanStack Query.
2. **Logic**: The query function calls a method in `src/services/api.ts`.
3. **Execution**: `api.ts` communicates with the Supabase client.
4. **Response**: Data is returned, normalized if necessary, and cached by TanStack Query for UI consumption.

## Current Target Architecture Progress
We are actively transitioning to a **Modular Component Architecture**:
- [x] Centralized site configuration and constants.
- [x] Extracting domain logic from `api.ts` into modules (Properties, Leads, Auth, Profile).
- [x] Implementing domain-specific hooks to encapsulate data fetching from pages.

### Module Structure (Standard)
```text
src/modules/[domain]/
├── components/ # Domain-specific UI
├── hooks/      # specialized React Query hooks
├── services/   # domain-specific Supabase interactions
└── types.ts    # module types
```
