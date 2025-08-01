'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  InformationCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { AIModel, AICapability } from '@/types/ai';

interface ModelSelectionCardProps {
  capability: {
    key: AICapability;
    label: string;
    description: string;
  };
  currentModelId?: string;
  availableModels: AIModel[];
  recommendations: {
    recommended: string[];
    description: string;
  };
  onModelChange: (modelId: string) => void;
  isLoading: boolean;
}

export default function ModelSelectionCard({
  capability,
  currentModelId,
  availableModels,
  recommendations,
  onModelChange,
  isLoading,
}: ModelSelectionCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const currentModel = availableModels.find((m) => m.id === currentModelId);
  const recommendedModels = availableModels.filter((m) =>
    recommendations.recommended.includes(m.id),
  );

  const formatCost = (inputCost: number, outputCost: number) => {
    return `$${inputCost.toFixed(4)}/$${outputCost.toFixed(4)} per 1K tokens`;
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'bg-green-100 text-green-800';
      case 'anthropic':
        return 'bg-orange-100 text-orange-800';
      case 'google':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Capability Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">{capability.label}</h3>
          <p className="text-sm text-gray-600">{capability.description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>

      {/* Current Model Selection */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={currentModelId || ''} onValueChange={onModelChange} disabled={isLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model..." />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getProviderColor(model.provider)}`}
                    >
                      {model.provider}
                    </Badge>
                    {recommendations.recommended.includes(model.id) && (
                      <SparklesIcon className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentModel && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getProviderColor(currentModel.provider)}>
              {currentModel.provider}
            </Badge>
            {currentModel.features.functionCalling && (
              <Badge variant="outline" className="text-xs">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                Functions
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Recommendations Alert */}
      <Alert>
        <InformationCircleIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Recommended:</strong> {recommendations.description}
          <div className="mt-2 flex flex-wrap gap-1">
            {recommendedModels.map((model) => (
              <Badge key={model.id} variant="outline" className="text-xs">
                {model.name}
              </Badge>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      {/* Detailed Model Information */}
      {showDetails && currentModel && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{currentModel.name} Details</CardTitle>
            <CardDescription>{currentModel.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing */}
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Pricing:</span>
              <span className="text-sm text-gray-600">
                {formatCost(currentModel.pricing.inputTokens, currentModel.pricing.outputTokens)}
              </span>
            </div>

            {/* Limits */}
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Limits:</span>
              <span className="text-sm text-gray-600">
                {currentModel.limits.maxTokens.toLocaleString()} max tokens,
                {currentModel.limits.contextWindow.toLocaleString()} context window
              </span>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Features:</span>
              <div className="flex flex-wrap gap-2">
                {currentModel.features.streaming && (
                  <Badge variant="outline" className="text-xs">
                    Streaming
                  </Badge>
                )}
                {currentModel.features.functionCalling && (
                  <Badge variant="outline" className="text-xs">
                    Function Calling
                  </Badge>
                )}
                {currentModel.features.vision && (
                  <Badge variant="outline" className="text-xs">
                    Vision
                  </Badge>
                )}
                {currentModel.features.codeGeneration && (
                  <Badge variant="outline" className="text-xs">
                    Code Generation
                  </Badge>
                )}
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Supported Capabilities:</span>
              <div className="flex flex-wrap gap-1">
                {currentModel.capabilities.map((cap) => (
                  <Badge
                    key={cap}
                    variant={cap === capability.key ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {cap.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
