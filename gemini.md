# Gemini Task Summary (Root Directory)

This document summarizes the project-level changes.

## Dependency Management

- Updated all project dependencies to their latest versions in `package.json`.
- Installed `vitest`, `@vitest/ui`, and `jsdom` as dev dependencies.

## Build & Test Configuration

- Configured `vitest` in `vite.config.ts` to use the `jsdom` environment for testing.
- Added `test` and `test:ui` scripts to `package.json` for running tests.
