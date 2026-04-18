---
description: "Use when writing, reviewing, or restructuring README.md and technical decision notes."
applyTo: "docs/**, README.md, .github/**/*.md"
---

# Documentation Instructions

## Language Policy

- Keep user-facing product copy in Spanish.
- Technical repository instructions may be in English to match sibling repos.
- Be explicit when a document is historical, provisional, or current architecture.

## Authoring Conventions

- Use concise, technical, actionable language.
- Prefer "link, do not duplicate": link existing docs instead of repeating long sections.
- Keep headings stable so links remain valid.
- Include short examples when they clarify behavior or integration points.
- Do not document planned behavior as if it already exists.

## Maintenance Rules

- When architecture changes in `src/**`, update affected docs in the same change set when practical.
- Keep `README.md` focused on public setup, MVP behavior, structure, and dependency constraints.
- Keep internal investigation notes out of the public README.
- Never commit secrets, credentials, private tokens, or internal confidential data.

## Suggested References

- Project onboarding: [README.md](../../README.md)
