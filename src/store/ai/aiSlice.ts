import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  AIConfigurationState,
  AIModel,
  AIModelConfig,
  AIProviderConfig,
  AIModelUsage,
} from '@/types/ai';
import { DEFAULT_AI_MODELS, DEFAULT_AI_CONFIG } from '@/lib/ai/models';

const initialState: AIConfigurationState = {
  availableModels: DEFAULT_AI_MODELS,
  userPreferences: null,
  providerConfigs: {},
  isLoading: false,
  error: null,
  usage: [],
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setAvailableModels(state, action: PayloadAction<AIModel[]>) {
      state.availableModels = action.payload;
    },
    setUserPreferences(state, action: PayloadAction<AIModelConfig>) {
      state.userPreferences = action.payload;
    },
    updateModelForCapability(
      state,
      action: PayloadAction<{ capability: string; modelId: string }>,
    ) {
      if (state.userPreferences) {
        state.userPreferences.modelsByCapability[
          action.payload.capability as keyof typeof state.userPreferences.modelsByCapability
        ] = action.payload.modelId;
      }
    },
    setDefaultModel(state, action: PayloadAction<string>) {
      if (state.userPreferences) {
        state.userPreferences.defaultModel = action.payload;
      }
    },
    setTemperature(state, action: PayloadAction<number>) {
      if (state.userPreferences) {
        state.userPreferences.temperature = action.payload;
      }
    },
    setMaxTokens(state, action: PayloadAction<number>) {
      if (state.userPreferences) {
        state.userPreferences.maxTokens = action.payload;
      }
    },
    setProviderConfig(
      state,
      action: PayloadAction<{ provider: string; config: AIProviderConfig }>,
    ) {
      state.providerConfigs[action.payload.provider] = action.payload.config;
    },
    setProviderConfigs(state, action: PayloadAction<Record<string, AIProviderConfig>>) {
      state.providerConfigs = action.payload;
    },
    addUsageRecord(state, action: PayloadAction<AIModelUsage>) {
      state.usage.unshift(action.payload);
      // Keep only last 100 records in memory
      if (state.usage.length > 100) {
        state.usage = state.usage.slice(0, 100);
      }
    },
    setUsageRecords(state, action: PayloadAction<AIModelUsage[]>) {
      state.usage = action.payload;
    },
    resetToDefaults(state) {
      state.userPreferences = { ...DEFAULT_AI_CONFIG };
      state.providerConfigs = {};
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setAvailableModels,
  setUserPreferences,
  updateModelForCapability,
  setDefaultModel,
  setTemperature,
  setMaxTokens,
  setProviderConfig,
  setProviderConfigs,
  addUsageRecord,
  setUsageRecords,
  resetToDefaults,
  clearError,
} = aiSlice.actions;

// Selectors
export const selectAIState = (state: { ai: AIConfigurationState }) => state.ai;
export const selectAvailableModels = (state: { ai: AIConfigurationState }) =>
  state.ai.availableModels;
export const selectUserPreferences = (state: { ai: AIConfigurationState }) =>
  state.ai.userPreferences;
export const selectProviderConfigs = (state: { ai: AIConfigurationState }) =>
  state.ai.providerConfigs;
export const selectAILoading = (state: { ai: AIConfigurationState }) => state.ai.isLoading;
export const selectAIError = (state: { ai: AIConfigurationState }) => state.ai.error;
export const selectUsageRecords = (state: { ai: AIConfigurationState }) => state.ai.usage;

// Derived selectors
export const selectModelForCapability =
  (capability: string) => (state: { ai: AIConfigurationState }) => {
    const preferences = state.ai.userPreferences || DEFAULT_AI_CONFIG;
    const modelId =
      preferences.modelsByCapability[capability as keyof typeof preferences.modelsByCapability] ||
      preferences.defaultModel;
    return state.ai.availableModels.find((model) => model.id === modelId);
  };

export const selectModelsByProvider =
  (provider: string) => (state: { ai: AIConfigurationState }) => {
    return state.ai.availableModels.filter((model) => model.provider === provider);
  };

export const selectModelsByCapability =
  (capability: string) => (state: { ai: AIConfigurationState }) => {
    return state.ai.availableModels.filter((model) =>
      model.capabilities.includes(capability as any),
    );
  };

export const selectProviderConfig = (provider: string) => (state: { ai: AIConfigurationState }) => {
  return state.ai.providerConfigs[provider];
};

export const selectIsProviderConfigured =
  (provider: string) => (state: { ai: AIConfigurationState }) => {
    const config = state.ai.providerConfigs[provider];
    return config?.isEnabled && !!config.apiKey;
  };

export const selectTotalUsageCost = (state: { ai: AIConfigurationState }) => {
  return state.ai.usage.reduce((total, record) => total + record.cost, 0);
};

export const selectUsageByModel = (state: { ai: AIConfigurationState }) => {
  const usageByModel: Record<string, { tokens: number; cost: number; requests: number }> = {};

  state.ai.usage.forEach((record) => {
    if (!usageByModel[record.modelId]) {
      usageByModel[record.modelId] = { tokens: 0, cost: 0, requests: 0 };
    }
    usageByModel[record.modelId].tokens += record.tokensUsed;
    usageByModel[record.modelId].cost += record.cost;
    usageByModel[record.modelId].requests += record.requestCount;
  });

  return usageByModel;
};

export default aiSlice.reducer;
