'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { AIModel } from '@/types/ai';

interface ModelTestingCardProps {
  models: AIModel[];
  onTestModel: (modelId: string) => Promise<void>;
  getModelStatus: (modelId: string) => 'testing' | 'connected' | 'error' | 'unknown';
  testingModel: string | null;
}

export default function ModelTestingCard({
  models,
  onTestModel,
  getModelStatus,
  testingModel,
}: ModelTestingCardProps) {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [testPrompt, setTestPrompt] = useState(
    'Hello! Can you help me generate a simple interview question for a software engineer position?',
  );
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; response?: string; error?: string; duration?: number }>
  >({});

  const handleRunTest = async () => {
    if (!selectedModel) return;

    const startTime = Date.now();
    try {
      await onTestModel(selectedModel);
      const duration = Date.now() - startTime;
      setTestResults((prev) => ({
        ...prev,
        [selectedModel]: {
          success: true,
          response: 'Model connection successful! Ready to use.',
          duration,
        },
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults((prev) => ({
        ...prev,
        [selectedModel]: {
          success: false,
          error: error instanceof Error ? error.message : 'Connection failed',
          duration,
        },
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <ClockIcon className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'connected':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'testing':
        return 'bg-blue-100 text-blue-800';
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedModelData = models.find((m) => m.id === selectedModel);

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            Model Connection Testing
          </CardTitle>
          <CardDescription>
            Test connectivity and basic functionality of AI models before using them in production.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="test-model">Select Model to Test</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a model to test..." />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {model.provider}
                      </Badge>
                      {getStatusIcon(getModelStatus(model.id))}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Prompt */}
          <div className="space-y-2">
            <Label htmlFor="test-prompt">Test Prompt</Label>
            <Textarea
              id="test-prompt"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a test prompt to send to the model..."
              rows={3}
            />
          </div>

          {/* Model Info */}
          {selectedModelData && (
            <Alert>
              <SparklesIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedModelData.name}</strong> - {selectedModelData.description}
                <br />
                <span className="text-sm text-gray-600">
                  Provider: {selectedModelData.provider} | Max Tokens:{' '}
                  {selectedModelData.limits.maxTokens.toLocaleString()} | Cost: $
                  {selectedModelData.pricing.inputTokens.toFixed(4)}/$
                  {selectedModelData.pricing.outputTokens.toFixed(4)} per 1K tokens
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Test Button */}
          <Button
            onClick={handleRunTest}
            disabled={!selectedModel || !testPrompt.trim() || testingModel === selectedModel}
            className="w-full"
          >
            {testingModel === selectedModel ? (
              <>
                <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4 mr-2" />
                Test Model Connection
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Connection test results for all tested models.</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(testResults).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tests run yet. Select a model and run a test to see results.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(testResults).map(([modelId, result]) => {
                const model = models.find((m) => m.id === modelId);
                if (!model) return null;

                return (
                  <div key={modelId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {model.provider}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(result.success ? 'connected' : 'error')}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                        {result.duration && (
                          <span className="text-xs text-gray-500">{result.duration}ms</span>
                        )}
                      </div>
                    </div>

                    {result.success && result.response && (
                      <Alert>
                        <CheckCircleIcon className="h-4 w-4" />
                        <AlertDescription>{result.response}</AlertDescription>
                      </Alert>
                    )}

                    {!result.success && result.error && (
                      <Alert variant="destructive">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Error:</strong> {result.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Models Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Models Status</CardTitle>
          <CardDescription>
            Quick overview of connection status for all available models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {models.map((model) => {
              const status = getModelStatus(model.id);
              return (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{model.name}</div>
                    <Badge variant="outline" className="text-xs">
                      {model.provider}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <Badge className={`text-xs ${getStatusColor(status)}`}>
                      {status === 'unknown' ? 'Not Tested' : status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
