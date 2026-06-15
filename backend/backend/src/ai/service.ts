import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type LanguageModel,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createPetClinicTools } from './tools';

// ── Multi-provider AI setup ─────────────────────────────────────────────
//
// Set AI_PROVIDER in .env to switch:
//   "google"    → Gemini (free tier available)
//   "openai"    → GPT-4o
//   "anthropic" → Claude

function getModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER ?? 'openai').toLowerCase();

  switch (provider) {
    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(process.env.AI_MODEL ?? 'claude-sonnet-4-20250514');
    }
    case 'google': {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
      });
      return google(process.env.AI_MODEL ?? 'gemini-2.0-flash');
    }
    case 'openai':
    default: {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai(process.env.AI_MODEL ?? 'gpt-4o');
    }
  }
}

// ── System Prompt ───────────────────────────────────────────────────────
//
// Adapted from the official Spring PetClinic AI assistant
// (spring.io/blog/2024/09/26/ai-meets-spring-petclinic)
// but rewritten for PET OWNERS instead of clinic admins.

const SYSTEM_PROMPT = `You are a friendly AI assistant for the Spring PetClinic veterinary clinic. You help pet owners manage their pets and visits.

You are designed to assist pet owners with:
1. Finding and recommending veterinarians based on their specialties
2. Booking veterinary visits for their pets
3. Checking their pet's visit history
4. Answering general pet care and health questions

You are required to answer in a professional yet warm manner. If you don't know the answer, politely tell the user you don't know, then ask a followup question to clarify what they need.

When dealing with vets:
- If the user asks which vet to see, search by relevant specialty (surgery for injuries, radiology for diagnostics, dentistry for dental issues)
- If no specialty matches, suggest a general practitioner
- For emergencies, prioritize vets with surgery or emergency-related specialties
- If the user is unsure about returned results, explain that there may be additional veterinarians not shown

When helping book visits:
- First use get_my_pets to check what pets the user has
- If they have multiple pets, ask which pet the visit is for
- Ask for the preferred date (suggest soon if it sounds urgent)
- Ask for the reason or symptoms
- Confirm ALL details with the user before calling add_visit
- After booking, confirm the visit was created successfully

For owners, pets, or visits - always answer with the correct data from the database. Never make up information.

If the user is an admin, they can query pets and visits for any owner, not just their own. Use the ownerName parameter to search by owner name when asked about a specific user's pets.

Keep responses concise - pet owners are busy people. Use bold for important names and dates.`;

export interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  username: string;
  roles: string[];
}

export async function chatStream(req: ChatRequest) {
  const model = getModel();
  const tools = createPetClinicTools(req.username, req.roles);

  const uiMessages = req.messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .filter(m => m.content)
    .map(m => ({
      id: String(Math.random()),
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.content }],
    }));

  const modelMessages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    maxRetries: 1,
    stopWhen: stepCountIs(5),
    onError: (event) => {
      console.error('AI stream error:', event.error);
    },
  });

  return result;
}
