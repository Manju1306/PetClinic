# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 19 + TypeScript SPA frontend for the Spring PetClinic sample app. Built with Vite, styled with Tailwind v4 (via `@tailwindcss/vite`), routed with `react-router-dom` v7. Package manager is pnpm.

## Commands

- `pnpm dev` (or `pnpm start`) — Vite dev server. Port defaults to `4000`; override with `PORT=…`. `run.sh` runs it on `4444`.
- `pnpm build:prod` (or `build:clean`) — Vite production build to `public/dist/`.
- `pnpm test` — Vitest single run. `pnpm test:watch` for watch mode. Tests are only picked up if they live under `tests/**/__tests__/**` and match `*.{test,spec}.{ts,tsx,js,jsx}` (see `vite.config.ts`); files placed elsewhere will be silently ignored.
- Run a single test file: `pnpm test tests/__tests__/util.test.tsx`. Filter by name: `pnpm test -t "submitForm"`.
- `pnpm lint` — ESLint over `src/**/*.{ts,tsx}` (flat config in `eslint.config.js`).
- `pnpm typecheck` — `tsc --noEmit`. `tsconfig.json` has `strict: false` and `noImplicitAny: false`, so type errors are looser than a typical strict project — don't assume strict-mode guarantees.

## Backend API wiring

The backend base URL is **baked in at build/dev time**, not read at runtime:

- `vite.config.ts` injects `__API_SERVER_URL__` via Vite's `define`. Source of truth:
  - tests (`VITEST` set): `http://localhost:30000`
  - dev/build: `process.env.API_SERVER_URL` or default `http://localhost:3000`
- `src/util/index.tsx` exposes `url(path)` which prefixes that constant, and `submitForm(method, path, data, onSuccess)` which posts JSON and routes 204s vs JSON responses to the same callback.
- To point the client at a different backend, restart Vite with `API_SERVER_URL=…` — there is no `.env` loading and no runtime config endpoint.
- Note: `submitForm` currently uses `path` directly, so all callers wrap their path with `url(...)` themselves (e.g. `submitForm('POST', url('api/owners'), …)`). Keep that pattern when adding new calls.

## Architecture

Entry: `src/main.tsx` mounts a `RouterProvider` built from `src/configureRoutes.tsx`. All routes are children of `<App>` (`src/components/App.tsx`), which renders `<Menu>` + `<Outlet>`. There is **no global state library** — each page component fetches its own data with `useEffect` + `fetch(url(...))` and holds it in local `useState`.

Feature folders under `src/components/` (`owners/`, `pets/`, `vets/`, `visits/`) follow a consistent split:
- `XxxPage.tsx` — route-level container; owns data fetching + URL params (`useParams`, `useSearchParams`).
- `XxxEditor.tsx` — controlled form component; owns the editable entity state and submit logic; navigates on success via `useNavigate`.
- Sibling presentational pieces (`OwnersTable`, `PetsTable`, `OwnerInformation`, etc.) take fully-resolved props.

The new/edit split is handled by an `isNew` flag on the entity model (see `IBaseEntity` in `src/types/index.ts`). Editors branch on `isNew` for both the HTTP verb (`POST` vs `PUT`) and the submit URL — preserve this pattern when adding entities.

## Forms

Shared form primitives live in `src/components/form/`:

- `Input`, `SelectInput`, `DateInput` — each takes the whole `object`, the `error: IError | null`, a `name`, an optional `constraint: IConstraint`, and an `onChange: (name, value, fieldError) => void`. They derive the field's current value and per-field error from those props rather than holding state themselves.
- `Constraints.ts` — `NotEmpty` and `Digits(n)`. `IConstraint` is `{ message, validate(value) => boolean }`; add new constraints here rather than inlining validators in editors.
- `FieldFeedbackPanel` — renders the valid/invalid message; styles key off `is-invalid` / `has-error` classes defined in `src/styles/app.css`.

The container (e.g. `OwnerEditor`) is responsible for merging per-field errors into the aggregate `IError.fieldErrors` map, and for replacing the whole error object when the server returns a validation failure response.

## Types

All shared model and form interfaces live in `src/types/index.ts` — `IOwner`, `IPet` / `IEditablePet` / `IPetRequest`, `IVet`, `IVisit`, `IConstraint`, `IFieldError`, `IError`, `ISelectOption`, etc. Prefer extending these over redeclaring shapes inline; the `IEditablePet` vs `IPet` vs `IPetRequest` split exists because the wire format, the in-memory edited form, and the loaded entity differ.

## Styling

Tailwind v4 via the Vite plugin. The single entry stylesheet is `src/styles/app.css`, which `@import`s `tailwindcss` and `react-datepicker/dist/react-datepicker.css`, defines theme tokens (`--color-spring-green`, etc.) in `@theme`, and supplies custom utility classes used throughout components (e.g. `pc-form-control`, `btn-default`, `col-form-label`, `is-invalid`, `has-error`). When adding form markup, reuse these classes rather than reaching for raw Tailwind so visuals stay consistent.
