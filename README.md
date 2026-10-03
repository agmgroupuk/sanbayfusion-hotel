# Sanbay Fusion Platform

A clean Next.js shell for Sanbay Fusion, LLC. The existing black-and-gold visual language is retained; application functionality will be added only after the existing app projects are provided and reviewed.

## Run locally

```sh
npm install
npm run dev
```

Production validation:

```sh
npm run typecheck
npm run lint
npm run build
npm start
```

## Current routes

- `/` — neutral platform landing page
- `/apps` — empty application directory until the supplied apps are integrated

## Shared visual foundation

- `app/globals.css` defines the dark palette, gold accent, typography roles, radii, and common responsive styles.
- `lib/fonts.ts` loads the retained display and interface typefaces.
- `components/ui/` contains generic styled controls.
- `components/site/` contains the shared platform header and footer.

## Future application folders

When the existing projects are ready for review, place their untouched source folders at the repository root under `apps/`, for example `apps/app-1/` through `apps/app-4/`. Keep each project's backend, dependencies, configuration, and environment files with that project until its integration architecture is assessed. No application code is integrated by this shell.
