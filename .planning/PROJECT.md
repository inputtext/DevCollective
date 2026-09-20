# Project: DevCollective

> **An AI-powered college learning and developer collaboration platform.**

---

## Executive Summary

DevCollective is an integrated campus ecosystem engineered to empower engineering students to learn modern technical domains, collaborate with peers, connect with verified mentors, build public portfolios, and track their growth through **Reputation Points (REP)**.

---

## Core Objectives & Value Proposition

1. **Structured Learning**: Provide guided foundational curricula (Level 0) and dynamic, progressive roadmaps tailored to individual skill levels.
2. **AI-Powered Mentorship**: Leverage Google Gemini 3.6 Flash for natural conversational roadmapping and structured resume analysis.
3. **Peer Collaboration & Real-Time Chat**: Enable direct student-to-student and student-to-mentor communication with rich message capabilities (delivery receipts, reactions, pins, stars).
4. **Transparent Reputation & Gamification**: Reward active contributions, project sharing, and learning milestone completion with REP, levels (1–6), streaks, and campus leaderboards.
5. **Campus Governance & Safety**: Enforce institutional email verification (`@ghrietn.raisoni.net`), administrative moderation, and mentor accreditation.

---

## Stakeholder Personas

- **Student Developer**: Discovers curated roadmaps, completes Level 0 checkpoints, posts project updates in "Build in Public", asks technical questions, and tracks campus ranking.
- **Peer / Senior Mentor**: Offers guidance, conducts 1-to-1 chats, reviews student progress, and shares domain insights.
- **Faculty Mentor**: Oversees academic alignment, validates curriculum rigor, and monitors campus-level developer activity.
- **Campus Administrator**: Moderates discussions, reviews mentor applications, approves verified badges, and oversees platform analytics.

---

## Architectural Summary

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion, GSAP, Three.js, Lucide icons.
- **Primary Backend**: Node.js Express API serving static SPA bundle, Clerk authentication middleware, and Supabase service integration.
- **Real-Time Backend**: Dedicated Node.js WebSocket service with token auth, presence tracking, and instant messaging.
- **Database & Storage**: Supabase PostgreSQL with RPC functions and secure file storage buckets.
- **AI Engine**: Google Gemini 3.6 Flash via official `@google/genai` SDK + local FastAPI BGE-M3 embedding service.
- **Hosting**: Render dual Web Service configuration (`devcollective-app` & `devcollective-ws`).
