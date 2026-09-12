# Pass 2 — Duplicate Detection + Adaptive Learning

## Duplicate detection

Backend endpoint: `POST /api/questions/check-duplicates`

It embeds the proposed title/content with BGE-M3 and calls `find_duplicate_questions` in Supabase. The current similarity threshold is 84% and up to five candidates are returned.

Primary user test: open DevCollective Community, choose the Questions category, draft a question that is similar to an existing question, and verify that duplicate candidates are surfaced before publication once the route is wired into the composer.

## Adaptive learning path

Backend endpoint: `GET /api/learning/adaptive-path`

The endpoint uses the authenticated profile, completed learning checkpoints, module progress, skills, selected domains, level and reputation. BGE-M3 is also used to retrieve related community posts for the target role and goal.

UI component: `src/components/AdaptiveLearningPath.tsx`

Primary user test: open the learning/Roadmap experience, refresh the adaptive path, then change profile skills/domain/level and verify that the recommended next steps change.

## Local infrastructure

BGE-M3 remains local at `http://127.0.0.1:8000` during development. DevCollective remains on the local Node server. Supabase remains the shared Postgres/pgvector backend.

Do not deploy the Oracle production BGE service until all eleven AI features have passed local regression testing.
