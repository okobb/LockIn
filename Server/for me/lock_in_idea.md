# Lock In - The Developer's Cognitive Command Center

**Tagline**: Stop drowning in Slack messages, context switches, and scattered knowledge.

## Core Problem
Developers lose 30+ minutes daily to three productivity killers:
1. **Communication Chaos**: 50+ Slack messages, which ones actually matter?
2. **Cold-Start Confusion**: "What was I doing before that meeting?"
3. **Wasted Downtime**: 45-minute commute spent scrolling, not learning

## The Solution
Lock In is your AI-powered work companion that saves your cognitive state, surfaces relevant knowledge proactively, and protects your focus—turning context switching from a 20-minute drain into a 2-minute restore.

## Three Core Features

### 1. Unified Intelligence Briefing
**The Problem**: You start each day (or return from any break) facing 50+ unread Slack messages, 12 browser tabs, email backlog, and context amnesia.

**The Solution**: Wake up to a single page that tells you exactly what needs your attention and where you left off.

**Features**:
- **Morning Mission Brief**: Top 3 High-Priority Tasks with AI reasoning.
- **Context Restoration**: Git Diff Display, Voice Memo Recap, Open Tabs Restored.
- **Calendar Integration**: Today's meetings, prep reminders, smart suggestions.
- **Communication Synthesis**: Recent Slack threads, PRs awaiting review, email action items.

### 2. Contextual Learning Engine (The "Senior Engineer" Persona)
**The Problem**: Searching for the same things repeatedly, wasted downtime, no senior guidance.

**The Solution**: The right knowledge, at the right time, in the right format.

**Features**:
- **The "Senior" Watcher**: Monitors active tabs/dev env for technical keywords and proactive suggestions.
- **Content Refinery**: Save URLs, AI extracts metadata and generates embeddings for RAG.
- **Liquid Scheduler**: Fills calendar gaps with relevant learning content (Audio for commute, Quick article for meeting gap).

### 3. Real-Time Focus Protection
**The Problem**: Constant interruptions destroying deep work.

**The Solution**: AI guardian that watches for urgency.

**Features**:
- **Smart Notifications**: Only alerts for true urgency (keywords, mentions).
- **Focus Mode**: Pauses notifications, locks environment (tabs, git state), starts timer.

## Cognitive Save State
The killer feature:
- **Trigger**: Manual, Automatic (pre-meeting), or End of day.
- **Captures**: Browser Context (tabs), Code Context (diff, branch), User Context (Voice Memo/Text Note).
- **Resume**: Restores tabs, shows diff, provides checklist of next steps.

## Tech Stack
- **Frontend**: Laravel + React (or Next.js + tRPC)
- **Backend/DB**: PostgreSQL + pgvector, Redis
- **Auth**: Clerk
- **AI**: OpenAI GPT-4o-mini, text-embedding-3-small, Whisper API, TTS API
- **Integrations**: n8n Cloud, GitHub API, Slack API, Google Calendar API
- **Infra**: Vercel, Railway/Render

## Suggested 30-Day MVP Plan
1. **Week 1**: Core Briefing (Slack/Calendar/GitHub integration, simple dashboard).
2. **Week 2**: Git Context (GitHub OAuth, diff extraction).
3. **Week 3**: Voice Memos + AI Synthesis (Chrome extension, Whisper).
4. **Week 4**: Knowledge Library + RAG (Save URL, embeddings, proactive suggestions).

## Database Schema Highlights
- **Users**: Standard auth + tier + preferences.
- **Integrations**: Tokens for Slack, GitHub, Gmail.
- **Context Snapshots**: Stores git diffs, browser state, voice transcripts.
- **Knowledge Resources**: URL, metadata, embeddings.
- **Incoming Messages**: For AI analysis/priority.
- **Tasks**: AI-summarized priorities.

## Unique Value
- Combines communication parsing, git context, voice memos, and liquid scheduling.
- **Moat**: The integration of these distinct context layers into a single "resume" flow. 
