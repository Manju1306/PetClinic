# Adding an AI Chat Assistant to an Existing App: A Step-by-Step Guide with TypeScript, Vercel AI SDK & MCP Tools

I added an AI-powered chat assistant to my PetClinic application — a TypeScript rebuild of the classic [Spring PetClinic](https://github.com/spring-projects/spring-petclinic) originally created by **Pivotal**, reimagined with Express 5 and React 19. The assistant helps pet owners find vets, book visits, and check their pet history through natural conversation.

Here's exactly how I built it, the decisions I made, and the problems I solved.

---

## The Problem

The official [Spring PetClinic AI blog](https://spring.io/blog/2024/09/26/ai-meets-spring-petclinic-implementing-an-ai-assistant-with-spring-ai-part-i) by the Spring team (Pivotal/VMware Tanzu) built their AI assistant for **clinic admins** using Spring AI and Java. But I realized: **pet owners need this more than admins do.** And I wanted to build it in TypeScript.

Admins maintain the system as their job — they know the UI, they have time. Pet owners are busy people who just want quick answers:

- *"My dog is limping, which vet should I see?"*
- *"Book a checkup for my cat next Monday"*
- *"When was Buddy's last visit?"*

A chat interface makes these tasks faster than navigating through multiple pages and forms.

---

## The Architecture

```
User types: "Which vet handles dental issues?"
         │
         ▼
┌─────────────────────────────────┐
│   React Chat Widget             │
│   • Floating bubble (bottom-right)
│   • Streams response in real-time
│   • Sends JWT for auth          │
└────────────┬────────────────────┘
             │ POST /api/chat
             ▼
┌─────────────────────────────────┐
│   Express Route                 │
│   • Validates JWT               │
│   • Extracts username + roles   │
│   • Streams text/plain response │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Vercel AI SDK v6              │
│   • streamText() with tools     │
│   • System prompt               │
│   • Multi-provider (swap via env)
└────────────┬────────────────────┘
             │  AI decides to call
             ▼  search_vets({specialty: "dentistry"})
┌─────────────────────────────────┐
│   MCP-Style Tools               │
│   • Query SQLite database       │
│   • Return structured results   │
│   • Scoped by user role         │
└────────────┬────────────────────┘
             │
             ▼
AI: "For dental issues, I'd recommend
     Dr. Linda Douglas — she specializes
     in dentistry and surgery."
```

---

## Step 1: Multi-Provider AI Service

### What is the Vercel AI SDK?

If you want to add AI to a web app today, you have several LLM providers to choose from — **OpenAI** (ChatGPT/GPT-4o), **Anthropic** (Claude), and **Google** (Gemini). Each one has its own API, its own request format, its own way of handling streaming responses, and its own way of doing tool calls.

The problem? If you write your code directly against OpenAI's API and later want to switch to Gemini (which has a free tier), you'd have to rewrite a big chunk of your backend.

The **[Vercel AI SDK](https://sdk.vercel.ai/)** solves this. It's an open-source TypeScript library (the npm package is simply called `ai`) that gives you **one unified interface** to talk to any LLM provider. You write your code once, and it works with OpenAI, Anthropic, Google, and many others. Think of it as an adapter layer — like how Sequelize lets you switch between PostgreSQL and SQLite without changing your queries.

Here's what it looks like in practice:

```typescript
// backend/src/ai/service.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

function getModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER ?? 'openai';

  switch (provider) {
    case 'google':
      return createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
      })('gemini-2.0-flash');

    case 'anthropic':
      return createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })('claude-sonnet-4-20250514');

    case 'openai':
    default:
      return createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })('gpt-4o');
  }
}
```

The key functions the SDK gives you:
- **`streamText()`** — Send a conversation to any LLM and get a streaming response back (the text arrives word by word, not all at once)
- **`tool()`** — Define functions the AI can call (more on this in Step 2)
- **`convertToModelMessages()`** — Convert chat messages into the format each provider expects
- **Provider packages** (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`) — Thin wrappers that handle each provider's specific API format

**Switching providers is a one-line `.env` change:**

```env
AI_PROVIDER=google          # or openai, anthropic
GOOGLE_AI_API_KEY=AIzaSy... # set the matching key
```

No code changes. No redeployment. The SDK handles all the protocol differences behind the scenes. This is huge — you can start with Google Gemini (free tier) for development, and switch to GPT-4o or Claude for production without touching your application code.

---

## Step 2: MCP-Style Database Tools

### What are AI Tools and MCP?

Here's the biggest problem with chatbots: **they make things up.** Ask a basic LLM "which vets do you have?" and it'll confidently invent fake vet names. It doesn't know your data.

**AI Tools** solve this. Instead of the AI guessing, you give it **functions it can call** to get real data. When a user asks "which vet handles dental issues?", the AI doesn't answer from its training data — it calls a `search_vets` function that runs a real database query and returns actual results. The AI then uses those results to write a natural-language answer.

Think of it like this: the AI is a smart assistant who can read and talk, but doesn't know your business. Tools are like giving that assistant access to your filing cabinet. They can look things up, but only through the drawers you've opened for them.

This pattern is called **MCP (Model Context Protocol)** — a standard introduced by Anthropic for connecting AI models to external data sources. The idea is simple: define a set of functions with clear descriptions, input parameters, and logic. The AI reads the descriptions, decides which function to call based on the user's question, and you execute it. It's become the standard way to give AI models access to real-world data — databases, APIs, file systems, anything.

In the Vercel AI SDK, you create tools using the `tool()` function. Each tool has three parts:
1. **Description** — A plain-English explanation that tells the AI *when* to use this tool
2. **Input schema** — A [Zod](https://zod.dev/) schema that defines *what parameters* the tool accepts (and validates them automatically)
3. **Execute function** — The actual code that runs *when the AI calls the tool* (database queries, API calls, etc.)

```typescript
// backend/src/ai/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export function createPetClinicTools(username: string, roles: string[]) {
  const isAdmin = roles.includes('ROLE_ADMIN');

  return {
    search_vets: tool({
      description:
        'Search veterinarians by specialty or name. ' +
        'Use when users ask about available vets or ' +
        'which vet is best for a specific condition.',
      inputSchema: z.object({
        specialty: z.string().optional(),
        name: z.string().optional(),
      }),
      execute: async ({ specialty, name }) => {
        let vets = await Vet.findAll({
          include: [{ model: Specialty, as: 'specialties' }],
        });

        if (specialty) {
          vets = vets.filter(v =>
            v.specialties?.some(s =>
              s.name.toLowerCase().includes(specialty.toLowerCase())
            )
          );
        }

        return vets.map(v => ({
          name: `Dr. ${v.first_name} ${v.last_name}`,
          specialties: v.specialties?.map(s => s.name) ?? [],
        }));
      },
    }),

    // ... 5 more tools
  };
}
```

### The 6 Tools I Built

| Tool | What It Does | Security |
|------|-------------|----------|
| `list_specialties` | Lists all vet specialties | Everyone |
| `search_vets` | Searches vets by specialty/name | Everyone |
| `get_my_pets` | Gets user's pets (or all, for admins) | Scoped by role |
| `get_pet_visits` | Gets visit history for a pet | Owner only (or admin) |
| `add_visit` | Books a new vet visit | Owner only (or admin) |
| `list_pet_types` | Lists supported pet types | Everyone |

### Security: Scoped by User

This is critical. Every tool receives the `username` from the JWT token, and data access is scoped accordingly:

- **Regular users** can only see their own pets and visits
- **Admins** can query across all owners
- The AI cannot bypass this — the filtering happens in the `execute` function, not in the prompt

```typescript
// Regular user: can only see own pets
const owner = await Owner.findOne({ where: { username } });

// Admin: can see all owners
if (isAdmin) {
  const owners = await Owner.findAll({ include: [Pet] });
}
```

---

## Step 3: The System Prompt

### What is a System Prompt?

Every AI chatbot has a **system prompt** — a set of instructions that the user never sees, but that shapes how the AI behaves. It's like onboarding a new employee: you tell them their role, what they're responsible for, how they should talk to customers, and what they should never do.

The system prompt is sent to the LLM with every request, before the user's messages. It defines the AI's personality, expertise, and rules. Without it, the AI is generic. With a good one, it becomes a specialist.

I adapted the official Spring PetClinic AI blog's prompt, but rewritten for pet owners:

```typescript
const SYSTEM_PROMPT = `You are a friendly AI assistant for the
Spring PetClinic veterinary clinic. You help pet owners manage
their pets and visits.

When dealing with vets:
- Search by relevant specialty (surgery for injuries,
  radiology for diagnostics, dentistry for dental issues)
- For emergencies, prioritize vets with surgery specialty
- Never make up information — always use the database

When helping book visits:
- First check what pets the user has (get_my_pets)
- Ask which pet, what date, what symptoms
- Confirm ALL details before booking
- After booking, confirm success

Keep responses concise — pet owners are busy people.
Use bold for important names and dates.`;
```

Key principle: **the AI should always query the database, never guess.** The prompt reinforces this, and the tools make it possible.

---

## Step 4: Streaming API Route

### Why Streaming?

When you ask an LLM a question, it doesn't generate the entire answer at once — it produces it **word by word** (technically, token by token). Without streaming, your app would wait until the entire response is generated (2-5 seconds), then dump it all at once. With streaming, the user sees the answer appearing in real-time as the AI "types" — the same experience you get on ChatGPT or Claude.ai.

The backend sends the response as a continuous stream of plain text, and the frontend reads it chunk by chunk, updating the chat bubble as each piece arrives.

Here's the chat endpoint:

```typescript
// backend/src/routes/chat.ts
router.post('/', requireAuth, async (req, res) => {
  const { messages } = req.body;
  const { username, roles } = req.user;

  const result = await chatStream({ messages, username, roles });

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  for await (const chunk of result.textStream) {
    res.write(chunk);
  }

  res.end();
});
```

The `streamText()` function from Vercel AI SDK handles all the heavy lifting behind the scenes:
- Takes the conversation history and sends it to whichever LLM you've configured (Gemini, GPT-4o, or Claude)
- If the AI decides it needs to call a tool (e.g., "I should look up vets with dental specialty"), the SDK **automatically executes the tool**, feeds the database results back to the AI, and the AI uses them to write its answer
- This can happen multiple times per request — the AI might first check what pets you have, then look up visit history, then suggest a vet. Each step is a separate tool call, and the SDK chains up to 5 of them automatically
- The final natural-language response streams back to the frontend chunk by chunk

---

## Step 5: React Chat Widget — Three Ways to Handle AI Streams

This is where most tutorials just show you `useChat` and call it a day. But in a real application, you have **three different approaches** to handle AI streaming on the frontend. Understanding the trade-offs is important because the "easy" way doesn't always work with existing apps.

### Approach 1: `useChat` Hook (The SDK Way)

The Vercel AI SDK provides a React hook called `useChat` that handles everything — message state, sending, streaming, loading states, error handling:

```typescript
// The "easy" way — works great for new projects
import { useChat } from '@ai-sdk/react';

function ChatWidget() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <form onSubmit={handleSubmit}>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <input value={input} onChange={handleInputChange} />
    </form>
  );
}
```

**Pros:** Minimal code. Handles message history, streaming, loading states, and error handling automatically. Great for new projects or quick prototypes.

**Cons:** It manages its own HTTP requests internally. This becomes a problem when your app already has an auth system. In our PetClinic app, every API call goes through `apiFetch()` — a custom fetch wrapper that automatically attaches the JWT Bearer token and handles token refresh when it expires. The `useChat` hook uses its own internal fetch, which doesn't know about our tokens. Result? **401 Unauthorized errors** because the AI endpoint requires authentication.

You can pass custom `headers` to `useChat`, but it won't handle token refresh (when the access token expires mid-conversation, `apiFetch` automatically gets a new one — `useChat` doesn't). You can also pass a custom `fetch` function, but at that point you're fighting the abstraction rather than using it.

### Approach 2: `ReadableStream` API (What I Used — The Browser Way)

Instead of using the SDK's hook, I used the browser's built-in **ReadableStream API** — the same API that powers `fetch()` responses. Every modern browser supports it.

Here's how it works: when you call `fetch()`, the response body is a `ReadableStream`. Normally you call `res.json()` or `res.text()` which waits for the entire response. But you can also read it **chunk by chunk** as it arrives:

```typescript
// The "manual" way — full control, works with any auth system
const sendMessage = async (text: string) => {
  // Use our existing apiFetch — JWT token + auto-refresh handled automatically
  const res = await apiFetch('api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  // Get a reader from the response stream
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  // Read chunks as they arrive from the server
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;  // Server closed the stream

    // value is a Uint8Array of bytes — decode it to text
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;

    // Update the React state — the UI re-renders with each chunk
    setMessages(prev =>
      prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
    );
  }
};
```

**What's happening step by step:**

1. `apiFetch('api/chat', ...)` — Makes a POST request using our existing auth wrapper. JWT token is attached automatically. If the token is expired, it refreshes it first. The `useChat` hook can't do this.

2. `res.body.getReader()` — Gets a `ReadableStreamDefaultReader`. This is a browser API (not from any library) that lets you read the response body incrementally instead of waiting for all of it.

3. `new TextDecoder()` — The stream gives us raw bytes (`Uint8Array`). `TextDecoder` converts them to a string. The `{ stream: true }` option tells it that more bytes might come (important for multi-byte characters like emojis).

4. `reader.read()` — Each call returns `{ done: boolean, value: Uint8Array }`. When the server sends a chunk of text, `value` contains those bytes and `done` is `false`. When the server finishes, `done` is `true`.

5. `setMessages(...)` — We update React state with each chunk. React re-renders, and the user sees the text growing in real-time.

**Pros:** Works with any existing auth system. No extra dependencies. Full control over error handling, retries, and state management. About 30 lines of code.

**Cons:** You manage message state yourself (which you were probably doing anyway in a real app). No built-in retry or error recovery.

### Approach 3: `textStream` Async Iterable (The Server Way)

On the **backend**, the Vercel AI SDK gives you `result.textStream` — an async iterable (similar to ReadableStream but for Node.js). This is what pipes the AI's response to the HTTP response:

```typescript
// Server-side — reading the AI stream and piping to the client
const result = streamText({ model, messages, tools });

// Option A: Manual control (what I used)
for await (const chunk of result.textStream) {
  res.write(chunk);  // Send each chunk to the browser immediately
}
res.end();

// Option B: One-liner (convenient but less error control)
result.pipeTextStreamToResponse(res);
```

**`textStream` explained:** When the AI generates its response, the Vercel AI SDK gives you an async iterable — a stream you can loop through with `for await...of`. Each iteration gives you a small piece of text (a few words). You write each piece to the Express response immediately with `res.write()`. The browser receives it instantly and the `ReadableStream` reader on the frontend picks it up.

The SDK also offers `pipeTextStreamToResponse(res)` which does the same thing in one line. But I used the manual `for await` loop because it let me detect when the stream produced no content (API error, quota exceeded) and write a fallback error message instead of leaving the user staring at nothing.

### Why Not `useChat`? — The Real-World Decision

Here's a comparison table to make the choice clear:

| Feature | `useChat` Hook | `ReadableStream` (Manual) |
|---------|---------------|--------------------------|
| Lines of code | ~5 | ~30 |
| Works with custom auth (`apiFetch`) | No (uses internal fetch) | Yes (you control the fetch) |
| Automatic token refresh | No | Yes (via existing `apiFetch`) |
| Message state management | Automatic | Manual (you manage `useState`) |
| Error handling | Built-in | You write it |
| Streaming display | Automatic | Manual (update state per chunk) |
| Extra dependencies | `@ai-sdk/react` | None (browser built-in) |
| Best for | New projects, quick prototypes | Existing apps with auth |

**The bottom line:** If you're building a brand-new app with no existing auth system, `useChat` is great — it saves you time. But if you're **adding AI to an existing application** (which is the more common real-world scenario), the manual `ReadableStream` approach is better because it plugs into your existing infrastructure instead of fighting it.

In our case, the PetClinic app already had `apiFetch` with JWT auth, automatic token refresh, and CORS handling. Using `useChat` would have meant duplicating all of that logic or working around the hook's limitations. The manual approach was actually *less* code overall because we reused what we already had.

### Other Frontend Details

**Markdown rendering** — A lightweight renderer handles `**bold**`, bullet points (`•` and `-`), and line breaks. No heavy markdown library needed — just a simple `replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')` regex. For a chat widget, this covers 95% of what the AI produces.

**Auth-aware visibility** — The widget only renders when `isAuthenticated` is true. Logged-out users don't see the chat bubble at all. This is a one-line check at the top of the component.

---

## The Problems I Solved

### 1. AI SDK v6 Breaking Changes

Vercel AI SDK v6 has significant breaking changes from v4/v5:
- `parameters` became `inputSchema`
- `maxSteps` became `stopWhen: stepCountIs(5)`
- `CoreMessage` became `ModelMessage`
- `convertToModelMessages` now returns a Promise
- `UIMessage` uses `parts` array instead of `content` string

**Lesson:** Always read the actual type definitions, not blog posts from older versions.

### 2. Duplicate React in pnpm Monorepo

Installing `@ai-sdk/react` with npm while the frontend uses pnpm created two copies of React, causing the infamous "Invalid Hook Call" error.

**Fix:** Install everything with pnpm and add Vite resolve aliases:
```typescript
// vite.config.ts
resolve: {
  alias: {
    react: path.resolve(__dirname, 'node_modules/react'),
    'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
  }
}
```

### 3. Silent Stream Errors

When the LLM API fails (quota exceeded, invalid key), `pipeTextStreamToResponse` starts a 200 response and then the stream just... stops. The user sees nothing.

**Fix:** Read the stream manually and write a fallback message if no content was produced:
```typescript
let hasContent = false;
for await (const chunk of result.textStream) {
  hasContent = true;
  res.write(chunk);
}
if (!hasContent) {
  res.write("Sorry, the AI service is temporarily unavailable.");
}
```

### 4. Role-Based Tool Access

The first version scoped all tools to the logged-in user's `username`. Admin users couldn't query other owners' pets. Fixed by passing `roles` through to the tools and branching on `isAdmin`.

---

## The Result

A pet owner can now:

```
"My dog has been limping, which vet should I see?"
→ AI searches vets with surgery/orthopedic specialties
→ Returns real vet names from the database

"Book a visit for Buddy next Monday"
→ AI calls get_my_pets to find Buddy
→ Asks for the reason
→ Confirms details
→ Calls add_visit to create the record
→ Confirms the booking

"When was Buddy's last checkup?"
→ AI calls get_pet_visits with Buddy's ID
→ Returns actual visit dates and descriptions
```

Every answer comes from the database. No hallucination. No made-up vet names. No fake visit dates.

---

## What I'd Do Differently

1. **Start with Google Gemini for free-tier development.** OpenAI and Anthropic have no free tier. Gemini gives you 1,500 requests/day for free — plenty for development and testing.

2. **Build the streaming handler first, not the `useChat` hook.** The SDK's transport layer adds abstraction that fights existing auth patterns. The manual stream reader is simpler and more flexible.

3. **Add rate limiting early.** Each chat message can trigger multiple LLM calls (tool calling steps). Without rate limiting, a curious user can burn through your API quota fast.

---

## Tech Stack

| Component | Technology | What It Does |
|-----------|-----------|-------------|
| AI SDK | Vercel AI SDK v6 (`ai` package) | Unified interface to talk to any LLM provider |
| LLM Providers | Google Gemini, OpenAI GPT-4o, Anthropic Claude | The AI "brains" — swap via `.env` config |
| Tool Framework | MCP-style tools with Zod schemas | Gives the AI structured access to the database |
| Backend | TypeScript + Express 5 | REST API that proxies between frontend and AI |
| Frontend | React 19 + TypeScript | Chat widget with real-time streaming display |
| Database | SQLite + Sequelize | Stores owners, pets, vets, visits |
| Auth | JWT Bearer tokens | Secures chat endpoint + scopes tool access |
| Server Streaming | `textStream` async iterable | Reads AI output chunk-by-chunk on the server |
| Browser Streaming | `ReadableStream` API | Reads server response chunk-by-chunk in the browser |

---

## Key Takeaways

1. **AI tools (MCP pattern) are the real power.** The LLM itself is interchangeable — GPT-4o, Gemini, Claude all work. What makes the assistant actually useful is the structured database access through tools. The AI is just the "brain" that decides *when* to look something up. The tools are the "hands" that actually fetch the data. Without tools, you have a chatbot that guesses. With tools, you have a chatbot that knows.

2. **Multi-provider support is almost free with the right SDK.** The Vercel AI SDK abstracts away the differences between OpenAI, Anthropic, and Google. Your application code calls `streamText()` — the SDK handles the rest. Switching from GPT-4o to Gemini is literally changing one line in your `.env` file. This means you can start with a free provider for development and switch to a paid one for production without changing a single line of code.

3. **Security must be in the tool layer, not the prompt.** You might be tempted to write "please don't show other users' data" in the system prompt. Don't. Prompt instructions are suggestions, not enforcement. The real security must be in the `execute` function — the actual code that runs when a tool is called. If User A asks for User B's pets, the database query should filter by User A's username before it even reaches the AI.

4. **Streaming UX matters more than you think.** Users are willing to wait 3 seconds for a response they can read as it appears — it feels fast because they're already processing the first words. They're not willing to wait the same 3 seconds staring at a blank screen followed by a wall of text. The difference is perception, and streaming is what creates it.

5. **You can add AI to an existing app incrementally.** I didn't rewrite the app. I didn't restructure the database. I didn't change any existing components. I added two backend files (`service.ts`, `tools.ts`), one route (`chat.ts`), and one React component (`ChatWidget.tsx`). The rest of the app is completely unchanged. AI doesn't have to be a big-bang rewrite — it can be one feature.

---

Adding AI to an existing application doesn't require a rewrite. It requires giving the AI the right tools and the right constraints. The tools provide access to real data. The constraints keep it honest.

**Credits:** The PetClinic domain model and database schema originate from the [Spring PetClinic](https://github.com/spring-projects/spring-petclinic) by **Pivotal** (now VMware Tanzu). The AI assistant concept was inspired by the [official Spring PetClinic AI blog series](https://spring.io/blog/2024/09/26/ai-meets-spring-petclinic-implementing-an-ai-assistant-with-spring-ai-part-i). This TypeScript implementation, the pet-owner-focused approach, and all application code are original.

The code is open source. Try it, break it, build on it.

---

*Inspired by Pivotal's Spring PetClinic & the Spring AI blog. Built with Vercel AI SDK v6, powered by real data, not hallucinations.*
