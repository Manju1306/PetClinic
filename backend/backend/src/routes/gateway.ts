import { Router } from 'express';
import { llmGateway, type ProviderName } from '../ai/gateway';
import { requireRole } from '../auth/middleware';

const router = Router();

const adminOnly = requireRole('ROLE_ADMIN');

router.get('/config', adminOnly, (_req, res) => {
  res.json(llmGateway.getConfig());
});

router.put('/provider', adminOnly, (req, res) => {
  const { provider } = req.body as { provider: ProviderName };
  try {
    llmGateway.setPrimary(provider);
    res.json({ message: `Primary provider switched to ${provider}`, ...llmGateway.getConfig() });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/model', adminOnly, (req, res) => {
  const { provider, model } = req.body as { provider: ProviderName; model: string };
  try {
    llmGateway.setModel(provider, model);
    res.json({ message: `Model for ${provider} set to ${model}`, ...llmGateway.getConfig() });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/usage', adminOnly, (req, res) => {
  const limit = Number(req.query?.limit) || 50;
  res.json(llmGateway.getUsageLogs(limit));
});

router.get('/stats', adminOnly, (_req, res) => {
  res.json(llmGateway.getUsageStats());
});

export default router;
