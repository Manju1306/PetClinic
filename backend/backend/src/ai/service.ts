import {
  streamText,
  convertToModelMessages,
  stepCountIs,
} from 'ai';
import { createPetClinicTools } from './tools';
import { llmGateway } from './gateway';

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

You also have access to a knowledge base via the search_knowledge tool. Use it when users ask about:
- Pet care topics: vaccinations, nutrition, dental care, exercise, parasites, spay/neuter, emergencies, senior pet care
- Clinic information: hours, location, services, pricing, new patient info
Always search the knowledge base for these topics instead of relying on your general knowledge, so answers reflect this clinic's specific guidance.

Keep responses concise - pet owners are busy people. Use bold for important names and dates.`;

export interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  username: string;
  roles: string[];
}

export async function chatStream(req: ChatRequest) {
  const { model, provider } = await llmGateway.getModelWithFallback();
  const tools = createPetClinicTools(req.username, req.roles);
  const config = llmGateway.getConfig();
  const modelName = config.providers.find(p => p.name === provider)?.model ?? 'unknown';

  const startTime = Date.now();

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
    onFinish: () => {
      llmGateway.logUsage({
        provider,
        model: modelName,
        latencyMs: Date.now() - startTime,
        success: true,
        username: req.username,
      });
    },
    onError: (event) => {
      console.error('AI stream error:', event.error);
      llmGateway.logUsage({
        provider,
        model: modelName,
        latencyMs: Date.now() - startTime,
        success: false,
        error: String(event.error),
        username: req.username,
      });
    },
  });

  return result;
}
