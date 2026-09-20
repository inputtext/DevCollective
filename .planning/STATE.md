# Project State

> Memory snapshot of the DevCollective project for session handoff and context continuity.

---

## Current Position

- **Milestone**: Milestone 2: Quality, Intelligence & Deep Engagement
- **Current Phase**: Phase 7 — Automated Quality Gates & Test Suite
- **Phase Status**: Ready for Planning
- **Last Action**: Completed `/gsd-onboard` brownfield discovery, codebase mapping, and doc ingestion.

---

## Project Context & Architecture

- **Project**: DevCollective (College learning & collaboration platform)
- **Runtime**: Node.js 22 + React 19 + Express + WebSocket Server + Python AI Service
- **Key Integrations**: Clerk (auth), Supabase (Postgres & storage), Google Gemini 3.6 Flash (AI mentor & resume extraction)
- **Deployment**: Dual Render Web Services (`devcollective-app` and `devcollective-ws`)
- **Git Status**: Clean working tree with `.planning/` initialized.

---

## Key Technical Decisions Made

1. **Dual Render Services**: Decided on hosting Express API + static SPA on one service and dedicated WebSocket server on a secondary service with shared Clerk/Supabase credentials.
2. **Postgres Profile Synchronization**: Decided to use Clerk as the authentication authority and mirror authenticated users into Supabase `devcollective_profiles` for relational integrity with posts, messages, and progress.
3. **Structured AI Responses**: Implemented Gemini 3.6 Flash function calling (`finalize_roadmap`) and structured schema extraction (`/api/resume/parse`) to guarantee typed JSON responses.
4. **Campus Domain Protection**: Enforced `@ghrietn.raisoni.net` institutional email filtering on sensitive campus routes while preserving admin overrides via `ADMIN_EMAILS`.

---

## Next Steps

1. Review onboarding findings in `.planning/onboarding/SUMMARY.md`.
2. Run `/gsd-plan-phase 7` to create an executable plan for adding Vitest test automation and regression coverage.
