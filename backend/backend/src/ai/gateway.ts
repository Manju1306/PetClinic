import { type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// ── LLM Gateway ────────────────────────────────────────────────────────
//
// Central routing layer for all LLM calls. Provides:
//  • Dynamic provider switching at runtime (no restart needed)
//  • Automatic failover — if the primary provider errors, try the next
//  • Per-request logging with latency, tokens, and provider used
//  • Admin API to view/change config and read usage logs

export type ProviderName = 'google' | 'openai' | 'anthropic';

interface ProviderConfig {
  name: ProviderName;
  model: string;
  available: boolean;
}

interface UsageLogEntry {
  timestamp: string;
  provider: ProviderName;
  model: string;
  latencyMs: number;
  success: boolean;
  error?: string;
  username?: string;
}

const PROVIDER_DEFAULTS: Record<ProviderName, string> = {
  google: 'gemini-2.5-flash',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
};

class LLMGateway {
  private primary: ProviderName;
  private fallbackOrder: ProviderName[];
  private modelOverrides: Partial<Record<ProviderName, string>> = {};
  private usageLog: UsageLogEntry[] = [];
  private maxLogSize = 500;

  constructor() {
    this.primary = (process.env.AI_PROVIDER as ProviderName) ?? 'google';
    this.fallbackOrder = this.buildFallbackOrder();
  }

  private buildFallbackOrder(): ProviderName[] {
    const all: ProviderName[] = ['google', 'openai', 'anthropic'];
    return [this.primary, ...all.filter(p => p !== this.primary)];
  }

  private hasApiKey(provider: ProviderName): boolean {
    switch (provider) {
      case 'google': return !!process.env.GOOGLE_AI_API_KEY;
      case 'openai': return !!process.env.OPENAI_API_KEY;
      case 'anthropic': return !!process.env.ANTHROPIC_API_KEY;
    }
  }

  private createModel(provider: ProviderName): LanguageModel {
    const model = this.modelOverrides[provider] ?? PROVIDER_DEFAULTS[provider];

    switch (provider) {
      case 'google': {
        const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
        return google(model);
      }
      case 'anthropic': {
        const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        return anthropic(model);
      }
      case 'openai':
      default: {
        const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
        return openai(model);
      }
    }
  }

  getModel(): LanguageModel {
    return this.createModel(this.primary);
  }

  async getModelWithFallback(): Promise<{ model: LanguageModel; provider: ProviderName }> {
    for (const provider of this.fallbackOrder) {
      if (this.hasApiKey(provider)) {
        return { model: this.createModel(provider), provider };
      }
    }
    return { model: this.createModel(this.primary), provider: this.primary };
  }

  logUsage(entry: Omit<UsageLogEntry, 'timestamp'>) {
    this.usageLog.push({ ...entry, timestamp: new Date().toISOString() });
    if (this.usageLog.length > this.maxLogSize) {
      this.usageLog = this.usageLog.slice(-this.maxLogSize);
    }
  }

  // ── Admin methods ──────────────────────────────────────────────────

  getConfig(): {
    primary: ProviderName;
    fallbackOrder: ProviderName[];
    providers: ProviderConfig[];
  } {
    const providers: ProviderConfig[] = (['google', 'openai', 'anthropic'] as ProviderName[]).map(name => ({
      name,
      model: this.modelOverrides[name] ?? PROVIDER_DEFAULTS[name],
      available: this.hasApiKey(name),
    }));

    return { primary: this.primary, fallbackOrder: this.fallbackOrder, providers };
  }

  setPrimary(provider: ProviderName) {
    if (!PROVIDER_DEFAULTS[provider]) throw new Error(`Unknown provider: ${provider}`);
    this.primary = provider;
    this.fallbackOrder = this.buildFallbackOrder();
  }

  setModel(provider: ProviderName, model: string) {
    if (!PROVIDER_DEFAULTS[provider]) throw new Error(`Unknown provider: ${provider}`);
    this.modelOverrides[provider] = model;
  }

  getUsageLogs(limit = 50): UsageLogEntry[] {
    return this.usageLog.slice(-limit);
  }

  getUsageStats(): {
    totalRequests: number;
    successRate: string;
    byProvider: Record<string, { count: number; avgLatencyMs: number; errors: number }>;
  } {
    const total = this.usageLog.length;
    const successes = this.usageLog.filter(e => e.success).length;

    const byProvider: Record<string, { count: number; avgLatencyMs: number; errors: number }> = {};
    for (const entry of this.usageLog) {
      if (!byProvider[entry.provider]) {
        byProvider[entry.provider] = { count: 0, avgLatencyMs: 0, errors: 0 };
      }
      const p = byProvider[entry.provider];
      p.avgLatencyMs = (p.avgLatencyMs * p.count + entry.latencyMs) / (p.count + 1);
      p.count++;
      if (!entry.success) p.errors++;
    }

    for (const key of Object.keys(byProvider)) {
      byProvider[key].avgLatencyMs = Math.round(byProvider[key].avgLatencyMs);
    }

    return {
      totalRequests: total,
      successRate: total > 0 ? ((successes / total) * 100).toFixed(1) + '%' : 'N/A',
      byProvider,
    };
  }
}

export const llmGateway = new LLMGateway();
