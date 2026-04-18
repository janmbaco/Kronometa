# Kronometa Workspace Instructions

These instructions apply to the whole repository. Keep changes pragmatic, browser-safe, and aligned with the PickComponents architecture.

## Project Context

- Kronometa is a browser app for manual race finish timing.
- The app is TypeScript, Vite, Pico CSS, and `pick-components`.
- UI framework code comes from the published `pick-components` dependency.
- App DI uses the published `@janmbaco/injectkit` dependency.
- Tooling dependencies such as `vite`, `typescript`, `@types/node`, and `@playwright/test` are project-owned dependencies, not links to sibling apps.
- Do not introduce React or equivalent UI frameworks.

## Architecture

- Source code lives under `src/`.
- Use feature-first folders under `src/features/**`.
- Keep domain logic and temporal/race rules in `src/features/race/domain/**` and `src/features/race/services/**`.
- Components are presentational/reactive view objects. They must not call race/storage/export services directly.
- Components may import `Services` only to resolve initializer/lifecycle factories by class in decorators, following the existing PickComponents examples.
- Use `PickInitializer` for pre-render hydration and `PickLifecycleManager` for component-to-service mediation.
- Services are decorated with InjectKit `@Singleton()`. Initializers and lifecycle managers are decorated with `@Transient({ deps: [...] })`.
- Lifecycle managers are 1:1 with component instances. Repeated components rendered by `pick-for` must resolve a transient lifecycle from `Services.get(LifecycleClass)`.
- Prefer one global clock/tick source. Do not add per-row timers.
- Avoid duplicating race-mode logic between mass start and staggered start; extend the shared domain model instead.

## PickComponents Rules

- Prefer the installed `pick-components` package APIs and the existing Kronometa components before introducing new framework patterns.
- Follow existing PickComponents patterns for `@Pick`, `@PickRender`, `@Reactive`, `@Listen`, `pick-for`, `pick-select`, and `pick-action`.
- Keep listener handlers compatible with delegated selector listeners: do not assume `event.currentTarget` is the matched element. Use `event.target` and `closest(...)` when needed.
- Do not add manual application service registration unless a new integration genuinely cannot be represented with InjectKit decorators.
- Preserve bootstrap ordering in `src/main.ts`: install `InjectKitServicesAdapter`, load `app-injectables`, bootstrap framework, initialize the InjectKit container, then import/register components.
- Do not create hidden service dependencies in components.

## Code Style

- Use explicit TypeScript types and descriptive names.
- Keep public behavior simple and predictable.
- Validate external/user input at boundaries.
- Prefer small functions and local helpers over broad abstractions.
- Do not swallow errors silently.
- Do not hand-edit `dist/**`.
- Keep user-facing copy in Spanish unless the surrounding file clearly uses another language.

## Build and Validation

- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Preview production build: `npm run preview`

After source changes, run `npm run typecheck` and `npm run build` when feasible. For UI behavior changes, verify the flow in a browser or with the project Playwright dependency when needed.

## Documentation

- Keep `README.md` aligned with the current public behavior.
- Keep public documentation in `README.md`.
- Local technical notes may live under ignored `docs/**` when needed.

## Linked References

- Project overview: [README.md](../README.md)
- Test rules: [.github/instructions/testing.instructions.md](instructions/testing.instructions.md)
- Source rules: [.github/instructions/kronometa-src.instructions.md](instructions/kronometa-src.instructions.md)
- Documentation rules: [.github/instructions/docs.instructions.md](instructions/docs.instructions.md)

## Anti-Patterns

- Adding React or another UI framework.
- Calling domain services directly from components.
- Reintroducing `file:../...` package links for framework, DI, or tooling dependencies.
- Turning the app into a lap timer; Kronometa is manual finish timing.
- Adding one timer per row.
- Introducing broad infrastructure before the MVP needs it.
