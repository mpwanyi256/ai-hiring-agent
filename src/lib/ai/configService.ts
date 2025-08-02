import { createClient } from '@/lib/supabase/client';
import { DEFAULT_AI_MODELS, getModelById } from './models';
import {
  AIModel,
  AIModelConfig,
  UserAIPreferences,
  AIModelUsage,
  AICapability,
  AIProviderConfig,
} from '@/types/ai';
import { User } from '@/types';
import {
  hasAIModelConfigAccess,
  shouldUseDefaultOpenAIConfig,
} from '@/lib/utils/subscriptionUtils';
import { ChatOpenAI } from '@langchain/openai';
import { ai } from '../constants';

// Dynamic imports for optional providers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ChatAnthropic: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ChatGoogleGenerativeAI: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ChatAnthropic = require('@langchain/anthropic').ChatAnthropic;
} catch (error) {
  console.warn(
    'Anthropic provider not available. Install @langchain/anthropic to use Claude models.',
  );
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ChatGoogleGenerativeAI = require('@langchain/google-genai').ChatGoogleGenerativeAI;
} catch (error) {
  console.warn(
    'Google AI provider not available. Install @langchain/google-genai to use Gemini models.',
  );
}

class AIConfigurationService {
  private static instance: AIConfigurationService;
  private userPreferences: UserAIPreferences | null = null;
  private isInitialized = false;
  private currentUser: User | null = null;

  private constructor() {}

  static getInstance(): AIConfigurationService {
    if (!AIConfigurationService.instance) {
      AIConfigurationService.instance = new AIConfigurationService();
    }
    return AIConfigurationService.instance;
  }

  /**
   * Initialize the AI configuration service for a specific user
   */
  async initialize(userId: string, companyId: string, user?: User): Promise<void> {
    try {
      this.currentUser = user || null;
      await this.loadUserPreferences(userId, companyId);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI configuration service:', error);
      // Use default configuration on error
      this.userPreferences = this.getDefaultConfig();
      this.isInitialized = true;
    }
  }

  /**
   * Initialize AI configuration for a user/company (alias for initialize)
   */
  async initializeConfig(userId: string, companyId: string): Promise<void> {
    return this.initialize(userId, companyId);
  }

  /**
   * Load user preferences from database
   */
  private async loadUserPreferences(userId: string, companyId: string): Promise<void> {
    const supabase = createClient();

    // Check if user has access to custom AI configuration
    const hasCustomAccess = hasAIModelConfigAccess(this.currentUser);

    if (!hasCustomAccess) {
      // User doesn't have access to custom config, use default OpenAI
      this.userPreferences = this.getDefaultOpenAIConfig();
      return;
    }

    const { data, error } = await supabase
      .from('ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw error;
    }

    if (data) {
      this.userPreferences = {
        id: data.id,
        userId: data.user_id,
        companyId: data.company_id,
        config: data.config,
        providerConfigs: data.provider_configs,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } else {
      // No custom preferences found, check if should use default OpenAI
      const shouldUseDefault = shouldUseDefaultOpenAIConfig(this.currentUser, false);
      this.userPreferences = shouldUseDefault
        ? this.getDefaultOpenAIConfig()
        : this.getDefaultConfig();
    }
  }

  /**
   * Get default AI configuration
   */
  private getDefaultConfig(): UserAIPreferences {
    return {
      id: '',
      userId: '',
      companyId: '',
      config: {
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
      },
      providerConfigs: {
        openai: {
          provider: 'openai' as const,
          apiKey: ai.openaiApiKey,
          isEnabled: true,
        },
        anthropic: {
          provider: 'anthropic' as const,
          apiKey: '',
          isEnabled: false,
        },
        google: {
          provider: 'google' as const,
          apiKey: '',
          isEnabled: false,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get default OpenAI-only configuration for users without custom access
   */
  private getDefaultOpenAIConfig(): UserAIPreferences {
    return {
      id: '',
      userId: '',
      companyId: '',
      config: {
        defaultModel: 'gpt-4o-mini',
        modelsByCapability: {
          'question-generation': 'gpt-4o-mini',
          'candidate-evaluation': 'gpt-4o-mini', // Use cheaper model for non-Pro users
          'contract-enhancement': 'gpt-4o-mini',
          'email-generation': 'gpt-4o-mini',
          'interview-analysis': 'gpt-4o-mini',
          'resume-parsing': 'gpt-4o-mini',
          'job-matching': 'gpt-4o-mini',
        },
        fallbackModel: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1500, // Lower token limit for non-Pro users
        enableFallback: true,
      },
      providerConfigs: {
        openai: {
          provider: 'openai' as const,
          apiKey: ai.openaiApiKey || '',
          isEnabled: true,
        },
        anthropic: {
          provider: 'anthropic' as const,
          apiKey: '',
          isEnabled: false,
        },
        google: {
          provider: 'google' as const,
          apiKey: '',
          isEnabled: false,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get the appropriate model for a specific capability
   */
  getModelForCapability(capability: AICapability): AIModel {
    const config = this.userPreferences?.config || this.getDefaultConfig().config;
    const modelId = config.modelsByCapability[capability] || config.defaultModel;

    const model = getModelById(modelId);
    if (!model || !model.isAvailable) {
      // Fallback to default model
      const fallbackModel = getModelById(config.fallbackModel);
      if (fallbackModel && fallbackModel.isAvailable) {
        return fallbackModel;
      }
      // Last resort: return first available model
      return DEFAULT_AI_MODELS.find((m) => m.isAvailable) || DEFAULT_AI_MODELS[0];
    }

    return model;
  }

  /**
   * Create a configured LLM instance for a specific capability
   */
  async createLLMForCapability(capability: AICapability): Promise<any> {
    const model = this.getModelForCapability(capability);
    const config = this.userPreferences?.config || this.getDefaultConfig().config;

    switch (model.provider) {
      case 'openai':
        return new ChatOpenAI({
          openAIApiKey: this.getProviderApiKey('openai'),
          modelName: model.modelName,
          temperature: config.temperature,
          maxTokens: Math.min(config.maxTokens, model.limits.maxTokens),
          streaming: model.features.streaming,
        });

      case 'anthropic':
        return new ChatAnthropic({
          anthropicApiKey: this.getProviderApiKey('anthropic'),
          modelName: model.modelName,
          temperature: config.temperature,
          maxTokens: Math.min(config.maxTokens, model.limits.maxTokens),
          streaming: model.features.streaming,
        });

      case 'google':
        return new ChatGoogleGenerativeAI({
          apiKey: this.getProviderApiKey('google'),
          modelName: model.modelName,
          temperature: config.temperature,
          maxOutputTokens: Math.min(config.maxTokens, model.limits.maxTokens),
        });

      default:
        throw new Error(`Unsupported AI provider: ${model.provider}`);
    }
  }

  /**
   * Get API key for a specific provider
   */
  private getProviderApiKey(provider: string): string {
    const providerConfig =
      this.userPreferences?.providerConfigs[provider] ||
      this.getDefaultConfig().providerConfigs[provider];
    if (providerConfig?.apiKey) {
      return providerConfig.apiKey;
    }

    // Fallback to environment variables
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY || '';
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY || '';
      case 'google':
        return process.env.GOOGLE_AI_API_KEY || '';
      default:
        return '';
    }
  }

  /**
   * Update user's AI configuration
   */
  async updateUserConfig(
    userId: string,
    companyId: string,
    newConfig: Partial<AIModelConfig>,
  ): Promise<void> {
    const currentConfig = this.userPreferences?.config || this.getDefaultConfig().config;
    const updatedConfig: AIModelConfig = {
      defaultModel: newConfig.defaultModel ?? currentConfig.defaultModel,
      modelsByCapability: { ...currentConfig.modelsByCapability, ...newConfig.modelsByCapability },
      fallbackModel: newConfig.fallbackModel ?? currentConfig.fallbackModel,
      temperature: newConfig.temperature ?? currentConfig.temperature,
      maxTokens: newConfig.maxTokens ?? currentConfig.maxTokens,
      enableFallback: newConfig.enableFallback ?? currentConfig.enableFallback,
    };
    if (this.userPreferences) {
      this.userPreferences = { ...this.userPreferences, config: updatedConfig };
    } else {
      this.userPreferences = {
        id: '',
        userId,
        companyId,
        config: updatedConfig,
        providerConfigs: this.getDefaultConfig().providerConfigs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    await this.saveUserConfig(userId, companyId);
  }

  /**
   * Update provider configuration
   */
  async updateProviderConfig(
    userId: string,
    companyId: string,
    provider: string,
    config: AIProviderConfig,
  ): Promise<void> {
    if (this.userPreferences) {
      this.userPreferences.providerConfigs[provider] = config;
      await this.saveUserConfig(userId, companyId);
    }
  }

  /**
   * Save configuration to database
   */
  private async saveUserConfig(userId: string, companyId: string): Promise<void> {
    try {
      const supabase = createClient();

      const { error } = await supabase.from('ai_preferences').upsert({
        user_id: userId,
        company_id: companyId,
        config: this.userPreferences?.config,
        provider_configs: this.userPreferences?.providerConfigs,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error saving AI preferences:', error);
      }
    } catch (error) {
      console.error('Failed to save AI config:', error);
    }
  }

  /**
   * Get current user configuration
   */
  getUserConfig(): AIModelConfig {
    return this.userPreferences?.config || this.getDefaultConfig().config;
  }

  /**
   * Get available models
   */
  getAvailableModels(): AIModel[] {
    return DEFAULT_AI_MODELS.filter((model) => model.isAvailable);
  }

  /**
   * Get models by capability
   */
  getModelsByCapability(capability: AICapability): AIModel[] {
    return DEFAULT_AI_MODELS.filter(
      (model) => model.isAvailable && model.capabilities.includes(capability),
    );
  }

  /**
   * Test model connectivity
   */
  async testModelConnection(modelId: string): Promise<boolean> {
    try {
      const model = getModelById(modelId);
      if (!model) return false;

      const llm = await this.createLLMForCapability('question-generation');
      const response = await llm.invoke([{ role: 'user', content: 'Hello' }]);

      return !!response.content;
    } catch (error) {
      console.error(`Failed to test model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Log model usage for analytics
   */
  async logModelUsage(
    userId: string,
    companyId: string,
    modelId: string,
    capability: AICapability,
    tokensUsed: number,
    cost: number,
  ): Promise<void> {
    try {
      const supabase = createClient();

      await supabase.from('ai_model_usage').insert({
        user_id: userId,
        company_id: companyId,
        model_id: modelId,
        capability,
        tokens_used: tokensUsed,
        cost,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log model usage:', error);
    }
  }

  /**
   * Reset to default configuration
   */
  async resetToDefaults(userId: string, companyId: string): Promise<void> {
    this.userPreferences = this.getDefaultConfig();
    this.userPreferences.userId = userId;
    this.userPreferences.companyId = companyId;
    await this.saveUserConfig(userId, companyId);
  }
}

export const aiConfigService = AIConfigurationService.getInstance();
