# Sanbay Fusion Platform

The Next.js platform for Sanbay Fusion, LLC, using the shared black-and-gold design system. Agents chat, browser-based developer tools, and selected text-based Labs experiments are directly accessible without sign-in.

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

- `/` and `/apps` — platform landing and application directory
- `/agents` and `/agents/[agentId]` — public agent directory and chat
- `/tools` and `/tools/[slug]` — local browser utilities
- `/labs` and `/labs/[experiment]` — provider-backed text experiments
- `/auth/*` — sign-in, sign-up, and password recovery
- `/api/realtime/session` — OpenAI Realtime ephemeral-session creation

Direct product routes do not require an account. Chat state remains in memory
when there is no active account session; Lab generation can return provider
results without database history. Provider API routes are publicly callable
and have no platform usage limits at this stage, so configure provider billing
accordingly.

## Shared visual foundation

- `app/globals.css` defines the dark palette, gold accent, typography roles, radii, and common responsive styles.
- `lib/fonts.ts` loads the retained display and interface typefaces.
- `components/ui/` contains generic styled controls.
- `components/site/` contains the shared platform header and footer.

## Configuration

- `DATABASE_URL` must point to the intended Railway PostgreSQL database. The Prisma migrations are generated but have not been applied; verify the target before running `npm start`, whose prestart hook applies pending migrations.
- At least one supported provider key is required for text-based agent chat. Realtime voice specifically requires `OPENAI_API_KEY`.
- `OPENAI_REALTIME_MODEL` is optional and defaults to `gpt-realtime-2.1`.

## Supplied applications

The supplied `frontend/` and `backend/` trees remain intact as source references; the root platform does not depend on the legacy Express services. Selected Tools were integrated as browser-local utilities. Text-based Labs use the platform's configured provider keys and the root Prisma models for run and vote data. Port scanning, arbitrary-target API testing, simulated speed results, mocked threat data, and image/music/voice Labs remain excluded until their security and provider requirements are verified.
