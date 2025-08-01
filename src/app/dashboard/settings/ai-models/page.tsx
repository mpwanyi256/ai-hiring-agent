'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CogIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { hasAIModelConfigAccess } from '@/lib/utils/subscriptionUtils';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import {
  initializeAIConfig,
  updateAIConfig,
  testModelConnection,
  fetchUsageAnalytics,
} from '@/store/ai/aiThunks';
import { AICapability } from '@/types/ai';
import { MODEL_RECOMMENDATIONS } from '@/lib/ai/models';
import ModelSelectionCard from '@/components/ai/ModelSelectionCard';
import ProviderConfigCard from '@/components/ai/ProviderConfigCard';
import UsageAnalyticsCard from '@/components/ai/UsageAnalyticsCard';
import ModelTestingCard from '@/components/ai/ModelTestingCard';

const CAPABILITIES: { key: AICapability; label: string; description: string }[] = [
  {
    key: 'question-generation',
    label: 'Question Generation',
    description: 'Generate interview questions based on job requirements',
  },
  {
    key: 'candidate-evaluation',
    label: 'Candidate Evaluation',
    description: 'Analyze and score candidate responses',
  },
  {
    key: 'contract-enhancement',
    label: 'Contract Enhancement',
    description: 'Improve and refine contract templates',
  },
  {
    key: 'email-generation',
    label: 'Email Generation',
    description: 'Create professional email templates',
  },
  {
    key: 'interview-analysis',
    label: 'Interview Analysis',
    description: 'Deep analysis of interview performance',
  },
  {
    key: 'resume-parsing',
    label: 'Resume Parsing',
    description: 'Extract structured data from resumes',
  },
  {
    key: 'job-matching',
    label: 'Job Matching',
    description: 'Match candidates to job requirements',
  },
];

export default function AIModelsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { availableModels, userPreferences, providerConfigs, isLoading, error, usage } =
    useAppSelector((state) => state.ai);

  const [activeTab, setActiveTab] = useState('models');
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Check if user has access to AI model configuration
  const hasConfigAccess = hasAIModelConfigAccess(user);

  const [testingModel, setTestingModel] = useState<string | null>(null);

  useEffect(() => {
    dispatch(initializeAIConfig());
    dispatch(fetchUsageAnalytics({ days: 30 }));
  }, [dispatch]);

  const handleModelChange = async (capability: AICapability, modelId: string) => {
    const currentModels = userPreferences?.modelsByCapability || {};
    await dispatch(
      updateAIConfig({
        modelsByCapability: {
          ...currentModels,
          [capability]: modelId,
        } as Record<AICapability, string>,
      }),
    );
  };

  const handleTestModel = async (modelId: string) => {
    setTestingModel(modelId);
    try {
      const result = await dispatch(testModelConnection(modelId)).unwrap();
      setTestResults((prev) => ({ ...prev, [modelId]: result }));
    } catch (error) {
      setTestResults((prev) => ({ ...prev, [modelId]: false }));
    } finally {
      setTestingModel(null);
    }
  };

  const getModelStatus = (modelId: string) => {
    if (testingModel === modelId) return 'testing';
    if (testResults[modelId] === true) return 'connected';
    if (testResults[modelId] === false) return 'error';
    return 'unknown';
  };

  // Render upgrade prompt for users without access
  if (!hasConfigAccess) {
    return (
      <DashboardLayout>
        <UpgradePrompt
          user={user}
          featureName="AI Model Configuration"
          featureDescription="Configure and manage AI models for different capabilities"
          benefits={[
            'Choose from multiple AI providers (OpenAI, Anthropic, Google)',
            'Configure different models for specific capabilities',
            'Track usage analytics and optimize costs',
            'Test model connections and performance',
            'Advanced model selection per use case',
            'Real-time cost monitoring and optimization',
          ]}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="AI Model Configuration"
      subtitle="Configure AI models for different capabilities and manage provider settings"
      rightNode={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <SparklesIcon className="w-3 h-3 mr-1" />
            Dynamic Selection
          </Badge>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Info Alert */}
        <Alert>
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Configure different AI models for specific capabilities to optimize performance and
            cost. Models are automatically selected based on your preferences for each task type.
          </AlertDescription>
        </Alert>

        {/* Main Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="models">Model Selection</TabsTrigger>
            <TabsTrigger value="providers">Provider Config</TabsTrigger>
            <TabsTrigger value="testing">Model Testing</TabsTrigger>
            <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
          </TabsList>

          {/* Model Selection Tab */}
          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CogIcon className="w-5 h-5" />
                  Model Selection by Capability
                </CardTitle>
                <CardDescription>
                  Choose the best AI model for each specific capability based on your needs for
                  quality, speed, and cost.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {CAPABILITIES.map((capability, index) => (
                  <div key={capability.key}>
                    <ModelSelectionCard
                      capability={capability}
                      currentModelId={userPreferences?.modelsByCapability[capability.key]}
                      availableModels={availableModels.filter((model) =>
                        model.capabilities.includes(capability.key),
                      )}
                      recommendations={{
                        ...MODEL_RECOMMENDATIONS[capability.key],
                        recommended: [...MODEL_RECOMMENDATIONS[capability.key].recommended],
                      }}
                      onModelChange={(modelId) => handleModelChange(capability.key, modelId)}
                      isLoading={isLoading}
                    />
                    {index < CAPABILITIES.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Provider Configuration Tab */}
          <TabsContent value="providers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProviderConfigCard
                provider="openai"
                title="OpenAI"
                description="GPT models for versatile AI capabilities"
                config={providerConfigs.openai}
                models={availableModels.filter((m) => m.provider === 'openai')}
              />
              <ProviderConfigCard
                provider="anthropic"
                title="Anthropic"
                description="Claude models for analysis and reasoning"
                config={providerConfigs.anthropic}
                models={availableModels.filter((m) => m.provider === 'anthropic')}
              />
              <ProviderConfigCard
                provider="google"
                title="Google AI"
                description="Gemini models with large context windows"
                config={providerConfigs.google}
                models={availableModels.filter((m) => m.provider === 'google')}
              />
            </div>
          </TabsContent>

          {/* Model Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <ModelTestingCard
              models={availableModels}
              onTestModel={handleTestModel}
              getModelStatus={getModelStatus}
              testingModel={testingModel}
            />
          </TabsContent>

          {/* Usage Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <UsageAnalyticsCard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
