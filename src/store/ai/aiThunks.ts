import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { AIModelConfig, AIProviderConfig, AIModelUsage, AICapability } from '@/types/ai';
import { aiConfigService } from '@/lib/ai/configService';
import { createClient } from '@/lib/supabase/client';
import {
  setLoading,
  setError,
  setUserPreferences,
  setProviderConfigs,
  setUsageRecords,
  addUsageRecord,
} from './aiSlice';

export const initializeAIConfig = createAsyncThunk<void, void, { rejectValue: string }>(
  'ai/initializeConfig',
  async (_, { dispatch, rejectWithValue, getState }) => {
    const user = (getState() as RootState).auth.user;
    if (!user) {
      return rejectWithValue('User not found');
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await aiConfigService.initializeConfig(user.id, user.companyId);
      const config = aiConfigService.getUserConfig();
      dispatch(setUserPreferences(config));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize AI config';
      dispatch(setError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const updateAIConfig = createAsyncThunk<
  void,
  Partial<AIModelConfig>,
  { rejectValue: string }
>('ai/updateConfig', async (configUpdate, { dispatch, rejectWithValue, getState }) => {
  const user = (getState() as RootState).auth.user;
  if (!user) {
    return rejectWithValue('User not found');
  }

  dispatch(setLoading(true));
  dispatch(setError(null));

  try {
    await aiConfigService.updateUserConfig(user.id, user.companyId, configUpdate);
    const updatedConfig = aiConfigService.getUserConfig();
    dispatch(setUserPreferences(updatedConfig));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update AI config';
    dispatch(setError(message));
    return rejectWithValue(message);
  } finally {
    dispatch(setLoading(false));
  }
});

export const updateProviderConfig = createAsyncThunk<
  void,
  { provider: string; config: AIProviderConfig },
  { rejectValue: string }
>(
  'ai/updateProviderConfig',
  async ({ provider, config }, { dispatch, rejectWithValue, getState }) => {
    const user = (getState() as RootState).auth.user;
    if (!user) {
      return rejectWithValue('User not found');
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await aiConfigService.updateProviderConfig(user.id, user.companyId, provider, config);
      // Update local state
      dispatch(setProviderConfigs({ [provider]: config }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update provider config';
      dispatch(setError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const testModelConnection = createAsyncThunk<boolean, string, { rejectValue: string }>(
  'ai/testModelConnection',
  async (modelId, { rejectWithValue }) => {
    try {
      const isConnected = await aiConfigService.testModelConnection(modelId);
      return isConnected;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to test model connection';
      return rejectWithValue(message);
    }
  },
);

export const fetchUsageAnalytics = createAsyncThunk<
  AIModelUsage[],
  { days?: number },
  { rejectValue: string }
>('ai/fetchUsageAnalytics', async ({ days = 30 }, { dispatch, rejectWithValue, getState }) => {
  const user = (getState() as RootState).auth.user;
  if (!user) {
    return rejectWithValue('User not found');
  }

  dispatch(setLoading(true));
  dispatch(setError(null));

  try {
    const supabase = createClient();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data: usage, error } = await supabase
      .from('ai_model_usage')
      .select('*')
      .eq('company_id', user.companyId)
      .gte('timestamp', fromDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    const usageRecords: AIModelUsage[] = usage.map((record) => ({
      modelId: record.model_id,
      capability: record.capability as AICapability,
      tokensUsed: record.tokens_used,
      requestCount: record.request_count,
      cost: parseFloat(record.cost),
      timestamp: record.timestamp,
      userId: record.user_id,
      companyId: record.company_id,
    }));

    dispatch(setUsageRecords(usageRecords));
    return usageRecords;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch usage analytics';
    dispatch(setError(message));
    return rejectWithValue(message);
  } finally {
    dispatch(setLoading(false));
  }
});

export const logModelUsage = createAsyncThunk<
  void,
  {
    modelId: string;
    capability: AICapability;
    tokensUsed: number;
    cost: number;
  },
  { rejectValue: string }
>(
  'ai/logModelUsage',
  async ({ modelId, capability, tokensUsed, cost }, { dispatch, rejectWithValue, getState }) => {
    const user = (getState() as RootState).auth.user;
    if (!user) {
      return rejectWithValue('User not found');
    }

    try {
      await aiConfigService.logModelUsage(
        user.id,
        user.companyId,
        modelId,
        capability,
        tokensUsed,
        cost,
      );

      // Add to local state for immediate UI update
      const usageRecord: AIModelUsage = {
        modelId,
        capability,
        tokensUsed,
        requestCount: 1,
        cost,
        timestamp: new Date().toISOString(),
        userId: user.id,
        companyId: user.companyId,
      };

      dispatch(addUsageRecord(usageRecord));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to log model usage';
      return rejectWithValue(message);
    }
  },
);

export const resetAIConfig = createAsyncThunk<void, void, { rejectValue: string }>(
  'ai/resetConfig',
  async (_, { dispatch, rejectWithValue, getState }) => {
    const user = (getState() as RootState).auth.user;
    if (!user) {
      return rejectWithValue('User not found');
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await aiConfigService.resetToDefaults(user.id, user.companyId);
      const defaultConfig = aiConfigService.getUserConfig();
      dispatch(setUserPreferences(defaultConfig));
      dispatch(setProviderConfigs({}));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset AI config';
      dispatch(setError(message));
      return rejectWithValue(message);
    } finally {
      dispatch(setLoading(false));
    }
  },
);

export const validateProviderApiKey = createAsyncThunk<
  boolean,
  { provider: string; apiKey: string },
  { rejectValue: string }
>('ai/validateProviderApiKey', async ({ provider, apiKey }, { rejectWithValue }) => {
  try {
    // Simple validation by attempting to create a client
    switch (provider) {
      case 'openai':
        const { ChatOpenAI } = await import('@langchain/openai');
        const openaiClient = new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: 'gpt-3.5-turbo',
          maxTokens: 10,
        });
        await openaiClient.invoke([{ role: 'user', content: 'test' }]);
        return true;

      case 'anthropic':
        try {
          const { ChatAnthropic } = await import('@langchain/anthropic');
          const anthropicClient = new ChatAnthropic({
            anthropicApiKey: apiKey,
            modelName: 'claude-3-haiku-20240307',
            maxTokens: 10,
          });
          await anthropicClient.invoke([{ role: 'user', content: 'test' }]);
          return true;
        } catch (importError) {
          console.warn('Anthropic provider not available');
          return rejectWithValue('Anthropic provider not installed');
        }

      case 'google':
        try {
          const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
          const googleClient = new ChatGoogleGenerativeAI({
            apiKey: apiKey,
            model: 'gemini-1.5-flash',
            maxOutputTokens: 10,
          });
          await googleClient.invoke([{ role: 'user', content: 'test' }]);
          return true;
        } catch (importError) {
          console.warn('Google provider not available');
          return rejectWithValue('Google provider not installed');
        }

      default:
        return false;
    }
  } catch (error) {
    console.error(`API key validation failed for ${provider}:`, error);
    return rejectWithValue(`Invalid API key for ${provider}`);
  }
});
