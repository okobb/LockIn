# Lock In: 30-Day MVP Development Roadmap

**Created**: January 3, 2026  
**Constraint**: 30 days maximum | **Total Estimated**: 29.5 days ✅

## Week 1: Core Briefing (Days 1-7)

| Day | Task | Type | Priority |
|-----|------|------|----------|
| 1 | User Auth with Clerk | [Backend] | P0 |
| 1 | Configure Clerk webhooks + user sync | [Integration] | P0 |
| 2-3 | GitHub OAuth + repo selection UI | [Backend] | P0 |
| 2 | Add repo selector modal to Settings | [Frontend] | P0 |
| 3-4 | Git diff extraction service | [Backend] | P0 |
| 4 | Syntax highlighting for diff display | [Frontend] | P0 |
| 5 | Wire dashboard.html to live API | [Integration] | P0 |
| 5-6 | Google Calendar OAuth + read-only sync | [Backend] | P1 |
| 6 | Populate "Today's Schedule" timeline | [Frontend] | P1 |
| 7 | Buffer / testing / bug fixes | [All] | - |

**Deliverable**: Dashboard shows real calendar, GitHub diff from last commit.

---

## Week 2: Context Save/Restore (Days 8-14)

| Day | Task | Type | Priority |
|-----|------|------|----------|
| 8 | Chrome Extension: manifest + permissions | [Frontend] | P0 |
| 8-9 | Extension popup UI | [Frontend] | P0 |
| 9 | Tab capture logic (browser_state array) | [Frontend] | P0 |
| 10 | Context Snapshot Save API | [Backend] | P0 |
| 10 | Wire ContextSave.html to API | [Integration] | P0 |
| 11-12 | Context Restore Flow | [Backend] | P0 |
| 11 | Implement "Restore Tabs" JS functionality | [Frontend] | P0 |
| 12 | Context History API | [Backend] | P1 |
| 12 | Wire ContextHistory.html with API | [Frontend] | P1 |
| 13 | Web Push API setup (service worker) | [Backend] | P1 |
| 13 | Add push notification opt-in to Settings | [Frontend] | P1 |
| 14 | Buffer / integration testing | [All] | - |

**Deliverable**: "Lock In" button saves context, user can restore tabs from history.

---

## Week 3: Voice + AI Synthesis (Days 15-21)

| Day | Task | Type | Priority |
|-----|------|------|----------|
| 15 | Voice recording UI (MediaRecorder API) | [Frontend] | P0 |
| 15 | Add recording controls to ContextSave.html | [Frontend] | P0 |
| 16 | S3 upload service for audio files | [Backend] | P0 |
| 16-17 | Whisper API integration (n8n workflow) | [Backend] | P0 |
| 17 | Store transcript in voice_transcript column | [Backend] | P0 |
| 18-19 | AI Resume Checklist generation (GPT-4o-mini) | [Backend] | P0 |
| 19 | Display ai_resume_checklist in dashboard | [Frontend] | P0 |
| 20 | Focus Mode Timer logic (pause/resume) | [Frontend] | P0 |
| 20 | Focus session API (start/end/pause) | [Backend] | P0 |
| 21 | Checklist CRUD API | [Backend] | P1 |
| 21 | Wire checklist items to API | [Frontend] | P1 |

**Deliverable**: Voice memos transcribed, AI generates checklists, timer functional.

---

## Week 4: Knowledge + Polish (Days 22-30)

| Day | Task | Type | Priority |
|-----|------|------|----------|
| 22 | Save URL feature (scraping + metadata) | [Backend] | P1 |
| 22 | Add URL modal to KnowledgeLibrary.html | [Frontend] | P1 |
| 23-24 | RAG Lite (PostgreSQL trigram search) | [Backend] | P2 |
| 24 | Wire search to Knowledge Library | [Frontend] | P2 |
| 25 | Proactive Suggestion Card on dashboard | [Frontend] | P1 |
| 25 | Suggestion logic (context-aware matching) | [Backend] | P1 |
| 26 | Daily Stats aggregation trigger | [Backend] | P1 |
| 26 | Populate ProgressStats.html from API | [Frontend] | P1 |
| 27-28 | **Slack Integration - OAuth + @mentions** | [Backend] | P1 |
| 28 | Display Slack mentions in Communication Hub | [Frontend] | P1 |
| 29 | Context Quality Score badge | [Frontend] | P2 |
| 29 | Calculate quality_score on save | [Backend] | P2 |
| 30 | Onboarding + Landing polish | [Frontend] | P1 |

**Deliverable**: Knowledge search works, Slack mentions appear, quality scores display.

---

## Frontend Gaps to Fix

| Gap | File | Fix Required |
|-----|------|--------------|
| Quality Score Badge | `ContextHistory.html` | Add score badge to context cards |
| Voice Recording UI | `ContextSave.html` | Add microphone/recording controls |
| Tab Restore Logic | `ContextRestore.html` | Implement chrome.tabs.create() |
| Learning Engine Link | Sidebar nav | Remove or redirect to Knowledge Library |
| Notification Metrics | `ProgressStats.html` | Add blocked/allowed stat card |
| Urgency Indicators | `dashboard.html` | Add visual urgency levels |
| Task Source Icons | `dashboard.html` | Show Slack/GitHub/Manual icons |
| Focus Lock State | `tasks.html` | Add "locked" visual indicator |

---

## Summary

| Metric | Value |
|--------|-------|
| Total Days | 29.5 |
| Frontend Tasks | 18 |
| Backend Tasks | 19 |
| Integration Tasks | 5 |
| P0 (Critical) | 15 |
| P1 (Important) | 12 |
| P2 (Nice-to-have) | 5 |
