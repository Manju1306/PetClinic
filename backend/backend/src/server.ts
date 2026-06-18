import 'dotenv/config';
import { createApp } from './app';
import { sequelize, ensureAuthSchema } from './db';
import { initializeRAG } from './ai/knowledge/rag';

const PORT = Number(process.env.PORT ?? 3000);

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    await ensureAuthSchema();
    // eslint-disable-next-line no-console
    console.log('Database connection established.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }

  initializeRAG().catch(err => {
    console.warn('RAG initialization failed (knowledge search will retry on first query):', err.message);
  });

  const app = createApp();
  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`PetClinic API listening on port ${PORT}`);
  });

  const shutdown = (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`Received ${signal}, shutting down...`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

void main();