import { AIModel, AIModelConfig } from '@/types/ai';

export const DEFAULT_AI_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    modelName: 'gpt-4o',
    description: 'Most capable model, best for complex reasoning and analysis',
    capabilities: [
      'question-generation',
      'candidate-evaluation',
      'contract-enhancement',
      'email-generation',
      'interview-analysis',
      'resume-parsing',
      'job-matching',
    ],
    pricing: {
      inputTokens: 0.005,
      outputTokens: 0.015,
      currency: 'USD',
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 128000,
      rateLimitRpm: 10000,
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
      codeGeneration: true,
    },
    isAvailable: true,
    requiresApiKey: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    description: 'Fast and cost-effective model for most tasks',
    capabilities: [
      'question-generation',
      'candidate-evaluation',
      'contract-enhancement',
      'email-generation',
      'interview-analysis',
      'resume-parsing',
      'job-matching',
    ],
    pricing: {
      inputTokens: 0.00015,
      outputTokens: 0.0006,
      currency: 'USD',
    },
    limits: {
      maxTokens: 16384,
      contextWindow: 128000,
      rateLimitRpm: 30000,
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
      codeGeneration: true,
    },
    isAvailable: true,
    requiresApiKey: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    modelName: 'gpt-3.5-turbo',
    description: 'Legacy model, good for simple tasks',
    capabilities: ['question-generation', 'email-generation', 'contract-enhancement'],
    pricing: {
      inputTokens: 0.0005,
      outputTokens: 0.0015,
      currency: 'USD',
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 16385,
      rateLimitRpm: 10000,
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: false,
      codeGeneration: false,
    },
    isAvailable: true,
    requiresApiKey: true,
  },
  // Anthropic Models
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet-20241022',
    description: 'Excellent for analysis and reasoning tasks',
    capabilities: [
      'question-generation',
      'candidate-evaluation',
      'contract-enhancement',
      'email-generation',
      'interview-analysis',
      'resume-parsing',
      'job-matching',
    ],
    pricing: {
      inputTokens: 0.003,
      outputTokens: 0.015,
      currency: 'USD',
    },
    limits: {
      maxTokens: 8192,
      contextWindow: 200000,
      rateLimitRpm: 4000,
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
      codeGeneration: true,
    },
    isAvailable: true,
    requiresApiKey: true,
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    modelName: 'claude-3-haiku-20240307',
    description: 'Fast and efficient for quick tasks',
    capabilities: ['question-generation', 'email-generation', 'contract-enhancement'],
    pricing: {
      inputTokens: 0.00025,
      outputTokens: 0.00125,
      currency: 'USD',
    },
    limits: {
      maxTokens: 4096,
      contextWindow: 200000,
      rateLimitRpm: 4000,
    },
    features: {
      streaming: true,
      functionCalling: false,
      vision: true,
      codeGeneration: false,
    },
    isAvailable: true,
    requiresApiKey: true,
  },
  // Google Models
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    modelName: 'gemini-1.5-pro',
    description: "Google's most capable model with large context",
    capabilities: [
      'question-generation',
      'candidate-evaluation',
      'contract-enhancement',
      'email-generation',
      'interview-analysis',
      'resume-parsing',
      'job-matching',
    ],
    pricing: {
      inputTokens: 0.00125,
      outputTokens: 0.005,
      currency: 'USD',
    },
    limits: {
      maxTokens: 8192,
      contextWindow: 2000000,
      rateLimitRpm: 360,
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
      codeGeneration: true,
    },
    isAvailable: true,
    requiresApiKey: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    modelName: 'gemini-1.5-flash',
    description: 'Fast and cost-effective Google model',
    capabilities: [
      'question-generation',
      'email-generation',
      'contract-enhancement',
      'resume-parsing',
    ],
    pricing: {
      inputTokens: 0.000075,
      outputTokens: 0.0003,
      currency: 'USD',
    },
    limits: {
      maxTokens: 8192,
      contextWindow: 1000000,
      rateLimitRpm: 1000,
    },
    features: {
      streaming: true,
      functionCalling: true,
      vision: true,
      codeGeneration: false,
    },
    isAvailable: true,
    requiresApiKey: true,
  },
];

export const DEFAULT_AI_CONFIG: AIModelConfig = {
  defaultModel: 'gpt-4o-mini',
  modelsByCapability: {
    'question-generation': 'gpt-4o-mini',
    'candidate-evaluation': 'gpt-4o',
    'contract-enhancement': 'gpt-4o-mini',
    'email-generation': 'gpt-4o-mini',
    'interview-analysis': 'gpt-4o',
    'resume-parsing': 'gpt-4o-mini',
    'job-matching': 'gpt-4o',
  },
  fallbackModel: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  enableFallback: true,
};

export const MODEL_RECOMMENDATIONS = {
  'question-generation': {
    recommended: ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash'],
    description: 'Fast models work well for generating interview questions',
  },
  'candidate-evaluation': {
    recommended: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'],
    description: 'Use most capable models for accurate candidate assessment',
  },
  'contract-enhancement': {
    recommended: ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash'],
    description: 'Balanced models for contract editing and improvement',
  },
  'email-generation': {
    recommended: ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-flash'],
    description: 'Cost-effective models for email templates and content',
  },
  'interview-analysis': {
    recommended: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'],
    description: 'Advanced models for deep interview analysis and insights',
  },
  'resume-parsing': {
    recommended: ['gpt-4o-mini', 'gemini-1.5-flash', 'claude-3-haiku'],
    description: 'Efficient models for extracting structured data from resumes',
  },
  'job-matching': {
    recommended: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'],
    description: 'Sophisticated models for accurate job-candidate matching',
  },
} as const;

export function getModelById(modelId: string): AIModel | undefined {
  return DEFAULT_AI_MODELS.find((model) => model.id === modelId);
}

export function getModelsByCapability(capability: string): AIModel[] {
  return DEFAULT_AI_MODELS.filter((model) => model.capabilities.includes(capability as any));
}

export function getModelsByProvider(provider: string): AIModel[] {
  return DEFAULT_AI_MODELS.filter((model) => model.provider === provider);
}

export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getModelById(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1000) * model.pricing.inputTokens;
  const outputCost = (outputTokens / 1000) * model.pricing.outputTokens;

  return inputCost + outputCost;
}
