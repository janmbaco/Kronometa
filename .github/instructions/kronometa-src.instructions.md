---
description: "Use when editing Kronometa source files in src/**, especially PickComponents components, initializers, lifecycle managers, race domain logic, and services."
applyTo: "src/**"
---

# Kronometa Source Instructions

## Scope

- Applies to source changes under `src/**`.
- Keep the feature-first structure.
- Keep race timing behavior real and domain-driven, not demo-only.

## Component Boundaries

- Components expose reactive view state and user intentions.
- Components must not call race, storage, clock, or export services directly.
- Use `PickInitializer` for initial hydration before render.
- Use `PickLifecycleManager` to subscribe to component intent properties and call services.
- In decorators, resolving lifecycle/initializer factories through `Services.get(...)` is allowed and expected.
- Resolve dependencies by class, not string service tokens.
- Repeated components must receive a fresh `PickLifecycleManager` per component instance. Mark lifecycle managers as InjectKit `@Transient({ deps: [...] })` and resolve them with `Services.get(LifecycleClass)`.

## Domain and Services

- Keep the domain model unified for both `mass_start` and `staggered_start`.
- Preserve these core concepts:
  - `RaceMode = "mass_start" | "staggered_start"`
  - `RunnerStatus = "pending" | "running" | "finished"`
  - shared runner fields: `id`, `bib`, `label`, `status`, optional `startAt`, `finishAt`, `resultMs`
- Compute live elapsed time against the current global clock.
- Freeze `resultMs` when a runner finishes.
- Rank only finished runners by ascending `resultMs`.
- Compute gap as `resultMs - bestResultMs`.

## PickComponents Details

- Follow installed `pick-components` behavior and existing Kronometa usage.
- `@Pick` and `@PickRender` are both valid. Choose based on clarity, locality, and feature ownership, not perceived capability.
- Use `@Pick` when compact `ctx.state`, `ctx.html`, `ctx.css`, `ctx.listen`, `ctx.on`, `ctx.initializer`, or `ctx.lifecycle` makes the component clearer.
- Use `@PickRender` when explicit class fields, methods, `@Listen`, or separate initializer/lifecycle classes make the feature clearer.
- Use `pick-action` for intent events where it matches existing local patterns.
- Use `pick-select` for conditional branches.
- Use `pick-for` for repeated rows/items.
- For delegated `@Listen(selector, event)` handlers, derive the matched element from `event.target.closest(...)`.
- App services use `@janmbaco/injectkit` decorators. Prefer `@Singleton()` for domain/app services and `@Transient({ deps: [...] })` for initializers/lifecycle managers.
- Keep `src/app/app-injectables.ts` aligned when adding a new decorated service, initializer, or lifecycle manager.
- Keep InjectKit container initialization explicit in `src/main.ts`; `Services.get(...)` should resolve only, not build the container.

## Styling and UI

- Keep Pico CSS as the base.
- Add project CSS only when it supports the timing UI clearly.
- Keep the primary experience immediate and functional.
- Do not add marketing/landing-page framing.
- Preserve clean, readable mobile layouts.

## Validation

- After source changes, run:

```bash
npm run typecheck
npm run build
```

- For timing or rendering changes, verify at least one realistic race flow in the browser.
