# Contributing Guidelines

To maintain project quality and architectural integrity, all development must follow this workflow.

## The Continuous Documentation Workflow

### 1. Planning (`Plan`)
Before writing code, create or update a `task.md` and an `implementation_plan.md`. 
- Define the scope.
- Identify which existing components will be affected.
- Verify if the change matches the [Target Architecture](./ARCHITECTURE.md).

### 2. Architecture Review (`ADR Check`)
If the change introduces a new technology, a significant structural change, or a new pattern:
- Check existing **Architecture Decision Records (ADRs)** in `docs/adr/`.
- If needed, propose a new ADR using the template.

### 3. Implementation (`Execution`)
Write code following these standards:
- **TypeScript**: Use strict types; avoid `any`.
- **Modularity**: Favor modular services and custom hooks over monolithic logic.
- **Clean Code**: Follow SOLID principles.

### 4. Documentation Update (`Sync`)
Your PR is NOT complete if the documentation is outdated. Update:
- `ARCHITECTURE.md` if components or flows changed.
- `DATABASE_SCHEMA.md` if migrations were added.
- Inline JSDoc for complex logic.

### 5. Verification
- Run `npm run lint`.
- Add/Update tests if necessary (`npm test`).

## PR Checklist
- [ ] Implementation plan approved.
- [ ] Relevant ADRs created/updated.
- [ ] Database schema doc updated (if applicable).
- [ ] Architecture doc updated (if applicable).
- [ ] Lint and tests passed.
