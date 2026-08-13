# دستیار مهندس ناظر

یک اپلیکیشن موبایل فارسی و راست‌به‌چپ برای مدیریت پروژه‌های ساختمانی، ثبت بازدید و پیگیری پیشرفت با رویکرد آفلاین‌محور.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/smart-building-inspector run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/smart-building-inspector/app/` — Expo Router screens and tab navigation
- `artifacts/smart-building-inspector/components/AppUI.tsx` — reusable mobile UI primitives
- `artifacts/smart-building-inspector/context/ProjectContext.tsx` — local project state and AsyncStorage persistence
- `artifacts/smart-building-inspector/types/inspection.ts` — normalized project/stage types and default stages
- `artifacts/smart-building-inspector/constants/colors.ts` — light and dark semantic design tokens
- `lib/api-spec/openapi.yaml` — shared backend API contract (unchanged in Phase 1)

## Architecture decisions

- Phase 1 uses Expo Router with a tab group plus stack routes so project-specific modules can be added without restructuring navigation.
- Project records are normalized TypeScript entities and persisted locally through AsyncStorage; every record carries a sync status for the future queue.
- The UI is Persian-first and RTL by default, with semantic light/dark tokens and mobile-native touch targets.
- Default construction stages live in one typed source of truth rather than being embedded in screen components.
- Cloud APIs, AI, Google Drive, voice transcription, and advanced sync are intentionally deferred until the local workflow is stable.

## Product

Phase 1 includes:

- Persian RTL home dashboard with project, visit, violation, and report summaries
- Searchable/filterable project list with active/completed filters
- Project creation and editing with local persistence
- Project details with progress, stage, permit facts, violation count, and extensible module entry points
- Visits, reports, and settings sections with clear Phase 1 states
- Offline/local-storage status messaging and sync-ready record metadata

## User preferences

- Keep the experience Persian-first, RTL, professional, light/dark capable, and optimized for one-handed site use.

## Gotchas

- The mobile app is the Phase 1 product surface; the shared API server is not required for the current local-first flow.
- Do not add AI, Drive, voice transcription, PDF generation, or advanced synchronization until their contracts and privacy boundaries are defined.
- Use the Expo workflow for previewing the app; Expo environment values are injected by the managed workflow.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
