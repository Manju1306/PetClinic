import { Router } from 'express';
import { asyncHandler, BadRequestError } from '../middleware';
import { chatStream } from '../ai/service';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { messages } = (req.body ?? {}) as { messages?: unknown };
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestError('messages array is required');
    }

    const username = (req as any).user?.username;
    const roles: string[] = (req as any).user?.roles ?? [];
    if (!username) {
      throw new BadRequestError('User context not available');
    }

    try {
      const result = await chatStream({ messages, username, roles });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');

      let hasContent = false;
      for await (const chunk of result.textStream) {
        hasContent = true;
        res.write(chunk);
      }

      if (!hasContent) {
        res.write(
          "I'm sorry, I wasn't able to process your request right now. " +
          'The AI service may be temporarily unavailable. Please try again in a moment.',
        );
      }

      res.end();
    } catch (err: any) {
      console.error('Chat AI error:', err?.message ?? err);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
      res.write(
        "I'm sorry, something went wrong connecting to the AI service. " +
        'Please try again later.',
      );
      res.end();
    }
  }),
);

export default router;
