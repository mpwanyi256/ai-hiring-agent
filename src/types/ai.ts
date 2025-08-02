export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  modelName: string;
  description: string;
  capabilities: AICapability[];
  pricing: {
    inputTokens: number; // per 1K tokens
    outputTokens: number; // per 1K tokens
    currency: string;
  };
  limits: {
    maxTokens: number;
    contextWindow: number;
    rateLimitRpm: number; // requests per minute
  };
  features: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    codeGeneration: boolean;
  };
  isAvailable: boolean;
  requiresApiKey: boolean;
}

export type AICapability =
  | 'question-generation'
  | 'candidate-evaluation'
  | 'contract-enhancement'
  | 'email-generation'
  | 'interview-analysis'
  | 'resume-parsing'
  | 'job-matching';

export interface AIModelConfig {
  defaultModel: string;
  modelsByCapability: Record<AICapability, string>;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  enableFallback: boolean;
}

export interface UserAIPreferences {
  id?: string;
  userId: string;
  companyId: string;
  config: AIModelConfig;
  providerConfigs: Record<string, AIProviderConfig>;
  apiKeys?: Record<string, string>; // provider -> api key (deprecated, use providerConfigs)
  customModels?: AIModel[];
  createdAt: string;
  updatedAt: string;
}

export interface AIModelUsage {
  modelId: string;
  capability: AICapability;
  tokensUsed: number;
  requestCount: number;
  cost: number;
  timestamp: string;
  userId: string;
  companyId: string;
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  project?: string;
  isEnabled: boolean;
}

export interface AIConfigurationState {
  availableModels: AIModel[];
  userPreferences: AIModelConfig | null;
  providerConfigs: Record<string, AIProviderConfig>;
  isLoading: boolean;
  error: string | null;
  usage: AIModelUsage[];
}
