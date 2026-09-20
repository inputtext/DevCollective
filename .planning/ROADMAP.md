# Project Roadmap

> Single source of truth for phases, status, and milestone completion.
> Methodology: GSD (SPEC → PLAN → EXECUTE → VERIFY → COMMIT)

---

## Milestone 1: Campus MVP & Core Experience (Completed)

| Phase | Description | Status | Evidence |
|-------|-------------|--------|----------|
| **Phase 1** | Authentication, Onboarding & Campus Email Gate | Complete | Clerk + Supabase profiles + `@ghrietn.raisoni.net` regex |
| **Phase 2** | Learning Engine & Level 0 Submodule Checkpoints | Complete | `learning_modules`, RPC `complete_learning_submodule` |
| **Phase 3** | AI Roadmap Mentor & Resume Parsing | Complete | Gemini 3.6 Flash + `finalize_roadmap` function calling |
| **Phase 4** | Real-Time WebSocket Messaging & Presence | Complete | `server/websocket.ts` + dual service deployment on Render |
| **Phase 5** | Community Feed, Categories & Gamification (REP) | Complete | `devcollective_posts`, likes, leaderboard rankings |
| **Phase 6** | Admin Dashboard & Mentor Review Workflow | Complete | Resume bucket `mentor-resumes` + admin endpoints |

---

## Milestone 2: Quality, Intelligence & Deep Engagement (Active Planning)

### Phase 7: Automated Quality Gates & Test Suite
- **Objective**: Establish regression safety with an automated testing pipeline.
- **Scope**:
  - Install and configure `vitest` with TypeScript support.
  - Unit tests for data mappers (`toUserProfile`, `toMentorProfile`), email regex patterns, and validation rules.
  - Integration tests for Express API endpoints (`/api/health`, `/api/auth/me`, `/api/learning/level-0`).
  - GitHub Actions / local npm test script wiring.
- **Status**: Ready to Plan (`/gsd-plan-phase 7`)

### Phase 8: Interactive Discussions & Nested Comments
- **Objective**: Expand community discussions with threaded comments and notifications.
- **Scope**:
  - Migration for `devcollective_comments` and replies.
  - Real-time comment count updates and author badges.
  - Browser/toast notifications for replies to user posts.
- **Status**: Backlog

### Phase 9: Semantic Mentor & Project Matching
- **Objective**: Connect the Python BGE-M3 embedding service to student discovery.
- **Scope**:
  - Generate 1024-dimensional embeddings for mentor skills, bios, and student project ideas.
  - Supabase `pgvector` similarity search integration.
  - AI match score and recommendation explanations on Mentor Directory.
- **Status**: Backlog

### Phase 10: Events, Hackathons & Team Formation
- **Objective**: Turn `EventsPage.tsx` into a fully interactive campus competition system.
- **Scope**:
  - Event registration, team creation, and invite links.
  - Hackathon project submission and judging portal.
- **Status**: Backlog
