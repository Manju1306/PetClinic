# PetClinic AI Chat Assistant

An AI-powered chat assistant integrated into the PetClinic application, designed to help **pet owners** manage their pets and visits through natural conversation. Built with TypeScript, Vercel AI SDK v6, and supports multiple LLM providers.

> **Inspiration**: Adapted from the official [Spring PetClinic AI Assistant](https://spring.io/blog/2024/09/26/ai-meets-spring-petclinic-implementing-an-ai-assistant-with-spring-ai-part-i) blog series — but rewritten for **pet owners** instead of clinic admins. Owners are busy and need quick help; admins maintain the system as their job.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Backend](#backend)
  - [AI Service (Multi-Provider)](#ai-service-multi-provider)
  - [MCP-Style Tools](#mcp-style-tools)
  - [Chat API Route](#chat-api-route)
- [Frontend](#frontend)
  - [Chat Widget](#chat-widget)
  - [Streaming Responses](#streaming-responses)
- [Configuration](#configuration)
- [Role-Based Access](#role-based-access)
- [Example Conversations](#example-conversations)
- [File Structure](#file-structure)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │            ChatWidget Component                  │    │
│  │  • Floating chat bubble (bottom-right)           │    │
│  │  • Message history with streaming display        │    │
│  │  • Markdown rendering (bold, bullets)            │    │
│  │  • Auth-aware (only shown when logged in)        │    │
│  └──────────────────┬──────────────────────────────┘    │
│                     │ POST /api/chat                     │
│                     │ Bearer token (JWT)                 │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────┐
│                Express Backend                           │
│                     ▼                                    │
│  ┌──────────────────────────────────────────────┐       │
│  │           POST /api/chat Route                │       │
│  │  • Extracts username + roles from JWT         │       │
│  │  • Validates message array                    │       │
│  │  • Streams response back as text/plain        │       │
│  └──────────────────┬───────────────────────────┘       │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────┐       │
│  │           AI Service Layer                    │       │
│  │  • Multi-provider: OpenAI / Anthropic / Google│       │
│  │  • System prompt (pet owner focused)          │       │
│  │  • Vercel AI SDK v6 streamText()              │       │
│  │  • Up to 5 tool-calling steps per request     │       │
│  └──────────────────┬───────────────────────────┘       │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────┐       │
│  │           MCP-Style Tools (6 tools)           │       │
│  │  • list_specialties    • get_pet_visits        │       │
│  │  • search_vets         • add_visit             │       │
│  │  • get_my_pets         • list_pet_types        │       │
│  │  • Scoped by user role (owner vs admin)        │       │
│  └──────────────────┬───────────────────────────┘       │
│                     │                                    │
│  ┌──────────────────▼───────────────────────────┐       │
│  │           SQLite Database                     │       │
│  │  owners, pets, vets, visits, specialties      │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer      | Technology                                                  |
| ---------- | ----------------------------------------------------------- |
| AI SDK     | [Vercel AI SDK v6](https://sdk.vercel.ai/) (`ai` package)   |
| LLM        | Google Gemini, OpenAI GPT-4o, or Anthropic Claude (swappable) |
| Backend    | TypeScript + Express 5                                      |
| Frontend   | React 19 + TypeScript                                       |
| Database   | SQLite + Sequelize ORM                                      |
| Auth       | JWT (Bearer tokens)                                         |
| Styling    | Tailwind CSS v4 + custom CSS                                |
| Validation | Zod (for tool input schemas)                                |

---

## How It Works

1. **User opens the chat** by clicking the floating green bubble in the bottom-right corner
2. **User types a question** like "Which vet is best for my dog's dental issue?"
3. **Frontend sends the message** to `POST /api/chat` with the JWT Bearer token
4. **Backend creates an AI stream** using the configured LLM provider
5. **AI decides which tools to call** based on the user's question (e.g., `search_vets` with specialty "dentistry")
6. **Tools query the database** and return structured results to the AI
7. **AI formats a natural-language response** using the tool results
8. **Response streams back** to the frontend in real-time, rendered as it arrives

The AI can chain up to **5 tool calls** per request (e.g., first `get_my_pets` to find the pet, then `add_visit` to book an appointment).

---

## Backend

### AI Service (Multi-Provider)

**File**: `backend/src/ai/service.ts`

The AI service supports three LLM providers through Vercel AI SDK's unified interface:

```typescript
// Switch providers by changing AI_PROVIDER in .env
// No code changes needed — just swap the env var and API key

function getModel(): LanguageModel {
  switch (provider) {
    case 'google':    return google('gemini-2.0-flash');
    case 'anthropic': return anthropic('claude-sonnet-4-20250514');
    case 'openai':    return openai('gpt-4o');
  }
}
```

**Provider packages:**
- `@ai-sdk/openai` — OpenAI (GPT-4o, GPT-4o-mini, etc.)
- `@ai-sdk/anthropic` — Anthropic (Claude Sonnet, Claude Opus, etc.)
- `@ai-sdk/google` — Google (Gemini 2.0 Flash, Gemini 2.5 Flash, etc.)

**System Prompt**: Adapted from the official Spring PetClinic AI blog, rewritten for pet owners. Key behaviors:
- Professional yet warm tone
- Searches vets by relevant specialty for the user's described symptoms
- Prioritizes surgery/emergency vets for urgent cases
- Walks through visit booking step-by-step (get pets → pick pet → pick date → confirm → book)
- Never makes up data — always queries the database

### MCP-Style Tools

**File**: `backend/src/ai/tools.ts`

Tools are functions exposed to the AI model using the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) pattern. The AI sees each tool's name, description, and input schema, then decides when to call them.

| Tool | Description | Input | Who Can Use |
|------|-------------|-------|-------------|
| `list_specialties` | List all vet specialties (radiology, surgery, dentistry, etc.) | None | Everyone |
| `search_vets` | Search vets by specialty or name | `specialty?`, `name?` | Everyone |
| `get_my_pets` | Get pets for the current user (or all owners for admins) | `ownerName?` | Everyone (scoped) |
| `get_pet_visits` | Get visit history for a specific pet | `petId` | Owner of pet / Admin |
| `add_visit` | Book a new veterinary visit | `petId`, `date`, `description` | Owner of pet / Admin |
| `list_pet_types` | List supported pet types (dog, cat, bird, etc.) | None | Everyone |

Each tool uses **Zod schemas** for input validation:

```typescript
search_vets: tool({
  description: 'Search veterinarians by specialty or name...',
  inputSchema: z.object({
    specialty: z.string().optional().describe('Filter by specialty name'),
    name: z.string().optional().describe('Filter by vet name'),
  }),
  execute: async ({ specialty, name }) => {
    // Query database and return results
  },
}),
```

### Chat API Route

**File**: `backend/src/routes/chat.ts`

```
POST /api/chat
Authorization: Bearer <jwt-access-token>
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Which vets do you have?" }
  ]
}

Response: text/plain (streamed)
```

- Protected by `requireAuth` middleware
- Extracts `username` and `roles` from the JWT token
- Streams the AI response as plain text
- Gracefully handles AI errors with a user-friendly fallback message

---

## Frontend

### Chat Widget

**File**: `frontend/client/src/components/chat/ChatWidget.tsx`

A self-contained React component that renders:

1. **Floating bubble button** — Green circle with chat icon and "AI" badge, positioned at bottom-right
2. **Chat panel** — Opens on click with:
   - Header with title and close button
   - Scrollable message history
   - Welcome message with feature overview
   - Typing indicator (animated dots)
   - Error display
   - Input form with send button

**Key behaviors:**
- Only visible when the user is authenticated (`isAuthenticated` check)
- Uses `apiFetch` from the existing util module (same auth flow as all other pages)
- Maintains full conversation history in local state
- Auto-scrolls to the latest message
- Auto-focuses the input when opened

### Streaming Responses

The frontend reads the AI response as a stream for real-time display:

```typescript
const reader = res.body?.getReader();
const decoder = new TextDecoder();
let fullText = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  fullText += chunk;

  // Update the message in real-time as chunks arrive
  setMessages(prev =>
    prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
  );
}
```

**Markdown rendering** supports:
- **Bold text** via `**text**`
- Bullet points (`•` or `-`)
- Line breaks

### Chat Widget Styles

**File**: `frontend/client/src/styles/app.css` (appended at the end of `@layer components`)

- Uses existing CSS variables (`--color-spring-green`, `--color-spring-brown`)
- Responsive: full-width on mobile (<480px)
- Smooth animations for the typing indicator
- Hover effects on the chat bubble

---

## Configuration

All configuration is in `backend/.env`:

```env
# ── AI Provider ──────────────────────────────────
# Set to: openai, anthropic, or google
AI_PROVIDER=google

# ── API Keys (set the one matching your provider) ──
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIzaSy...

# ── Optional: Override the default model ──────────
# AI_MODEL=gpt-4o
# AI_MODEL=claude-sonnet-4-20250514
# AI_MODEL=gemini-2.0-flash
```

### Getting API Keys

| Provider | Free Tier | Get Key |
|----------|-----------|---------|
| Google Gemini | 1,500 req/day (2.0-flash), 20 req/day (2.5-flash) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| OpenAI | No free tier (pay-per-use) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic | No free tier (pay-per-use) | [console.anthropic.com](https://console.anthropic.com/) |

---

## Role-Based Access

The AI tools are **scoped by user role**:

### Regular Users (Pet Owners)
- Can only see **their own pets** via `get_my_pets`
- Can only view visits for **their own pets** via `get_pet_visits`
- Can only book visits for **their own pets** via `add_visit`
- Full access to vet search and specialty listing

### Admin Users (`ROLE_ADMIN` or `ROLE_OWNER_ADMIN`)
- Can see **all owners and their pets** via `get_my_pets` (no arguments)
- Can **search by owner name** via `get_my_pets` with `ownerName`
- Can view visits for **any pet**
- Can book visits for **any pet**
- Full access to vet search and specialty listing

The role check is based on the JWT token's `roles` array, determined at login.

---

## Example Conversations

### Pet Owner — Finding a Vet
```
User: My dog has a toothache, which vet should I see?
AI:   For dental issues, I'd recommend Dr. Linda Douglas who specializes
      in dentistry. She also has a surgery specialty if any procedures
      are needed.
```

### Pet Owner — Booking a Visit
```
User: I want to book a visit for my cat
AI:   Let me check your pets... You have a cat named Whiskers.
      What date would you like to schedule the visit?
User: Next Monday
AI:   And what's the reason for the visit?
User: Annual checkup
AI:   Just to confirm: Book a visit for Whiskers on 2026-06-22
      for "Annual checkup". Shall I go ahead?
User: Yes
AI:   Visit booked for Whiskers on 2026-06-22.
```

### Admin — Querying All Owners
```
User: Which owner has the most pets?
AI:   Looking at all owners:
      • Manju Ch — 3 pets
      • Eduardo Rodriquez — 2 pets
      • Jean Coleman — 2 pets
      ...
      Manju Ch has the most pets with 3.
```

---

## File Structure

```
backend/src/ai/
├── service.ts          # Multi-provider AI setup, system prompt, chatStream()
└── tools.ts            # 6 MCP-style database tools with Zod schemas

backend/src/routes/
└── chat.ts             # POST /api/chat route with streaming

frontend/client/src/components/chat/
└── ChatWidget.tsx       # React chat widget (bubble + panel + streaming)

frontend/client/src/styles/
└── app.css             # Chat widget CSS (appended to @layer components)

backend/.env            # AI_PROVIDER, API keys, optional model override
```

---

## Troubleshooting

### Chat returns "AI service temporarily unavailable"
- Check backend logs for the specific error
- Most common: API key quota exhausted (especially on Google free tier)
- Fix: Wait for quota reset, get a new key in a new project, or switch providers

### Empty response / no text streams
- The `onError` callback in `streamText` logs errors to console
- Check if the response Content-Type is `text/plain`
- The backend gracefully returns a fallback message if the stream produces no content

### 401 Unauthorized on chat requests
- Ensure the user is logged in (JWT token present)
- Check that the `requireAuth` middleware is correctly mounted on `/api/chat`
- Verify CORS settings allow the `Authorization` header

### Tool calls not working
- The AI decides whether to call tools based on the question
- Check the tool descriptions — they guide the AI's decision
- Increase `stepCountIs(5)` if the AI needs more steps for complex queries
- Check Sequelize query logs for database errors

### Rate limits (Google Gemini free tier)
| Model | Requests/Minute | Requests/Day |
|-------|----------------|--------------|
| gemini-2.0-flash | 15 | 1,500 |
| gemini-2.5-flash | 10 | 20 |

If you hit rate limits, either wait for reset or create a new API key in a **new Google Cloud project** (same project = same quota).
