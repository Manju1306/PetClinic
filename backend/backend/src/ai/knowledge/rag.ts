import { embed, embedMany, cosineSimilarity } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { KNOWLEDGE_BASE, type KnowledgeArticle } from './articles';

interface EmbeddedArticle {
  article: KnowledgeArticle;
  embedding: number[];
}

let embeddedArticles: EmbeddedArticle[] = [];
let initialized = false;

function getEmbeddingModel() {
  const provider = (process.env.AI_PROVIDER ?? 'openai').toLowerCase();

  switch (provider) {
    case 'google': {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
      });
      return google.textEmbeddingModel('gemini-embedding-001');
    }
    case 'openai':
    default: {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai.textEmbeddingModel('text-embedding-3-small');
    }
  }
}

export async function initializeRAG(): Promise<void> {
  if (initialized) return;

  console.log(`Embedding ${KNOWLEDGE_BASE.length} knowledge articles...`);

  const model = getEmbeddingModel();
  const texts = KNOWLEDGE_BASE.map(a => `${a.title}. ${a.content}`);

  const { embeddings } = await embedMany({ model, values: texts });

  embeddedArticles = KNOWLEDGE_BASE.map((article, i) => ({
    article,
    embedding: embeddings[i],
  }));

  initialized = true;
  console.log(`RAG ready: ${embeddedArticles.length} articles embedded.`);
}

export async function searchKnowledge(
  query: string,
  topK = 3,
  category?: 'pet-care' | 'clinic',
): Promise<Array<{ title: string; content: string; category: string; score: number }>> {
  if (!initialized) {
    await initializeRAG();
  }

  const model = getEmbeddingModel();
  const { embedding: queryEmbedding } = await embed({ model, value: query });

  let candidates = embeddedArticles;
  if (category) {
    candidates = candidates.filter(e => e.article.category === category);
  }

  const scored = candidates.map(e => ({
    title: e.article.title,
    content: e.article.content,
    category: e.article.category,
    score: cosineSimilarity(queryEmbedding, e.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).filter(s => s.score > 0.3);
}
