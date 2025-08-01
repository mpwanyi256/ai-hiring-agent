'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { AIModel, AIProviderConfig } from '@/types/ai';
import { updateProviderConfig, validateProviderApiKey } from '@/store/ai/aiThunks';

interface ProviderConfigCardProps {
  provider: string;
  title: string;
  description: string;
  config?: AIProviderConfig;
  models: AIModel[];
}

export default function ProviderConfigCard({
  provider,
  title,
  description,
  config,
  models,
}: ProviderConfigCardProps) {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    apiKey: config?.apiKey || '',
    baseUrl: config?.baseUrl || '',
    organization: config?.organization || '',
    project: config?.project || '',
    isEnabled: config?.isEnabled ?? true,
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newConfig: AIProviderConfig = {
        provider: provider as any,
        ...formData,
      };

      await dispatch(updateProviderConfig({ provider, config: newConfig }));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save provider config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidateApiKey = async () => {
    if (!formData.apiKey.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await dispatch(
        validateProviderApiKey({
          provider,
          apiKey: formData.apiKey,
        }),
      ).unwrap();
      setValidationResult(result);
    } catch (error) {
      setValidationResult(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      apiKey: config?.apiKey || '',
      baseUrl: config?.baseUrl || '',
      organization: config?.organization || '',
      project: config?.project || '',
      isEnabled: config?.isEnabled ?? true,
    });
    setIsEditing(false);
    setValidationResult(null);
  };

  const isConfigured = config?.apiKey && config?.isEnabled;
  const availableModelsCount = models.filter((m) => m.isAvailable).length;

  return (
    <Card
      className={`transition-all ${isConfigured ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {title}
              {isConfigured && <CheckCircleIcon className="w-4 h-4 text-green-600" />}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant={isConfigured ? 'default' : 'outline'}>
            {isConfigured ? 'Configured' : 'Not Configured'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Models Available */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Available Models:</span>
          <Badge variant="outline">{availableModelsCount} models</Badge>
        </div>

        {/* Configuration Form */}
        {isEditing ? (
          <div className="space-y-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <Label htmlFor={`${provider}-enabled`} className="text-sm font-medium">
                Enable Provider
              </Label>
              <Switch
                id={`${provider}-enabled`}
                checked={formData.isEnabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isEnabled: checked }))
                }
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor={`${provider}-api-key`} className="text-sm font-medium">
                API Key *
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={`${provider}-api-key`}
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your API key..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidateApiKey}
                  disabled={!formData.apiKey.trim() || isValidating}
                >
                  {isValidating ? 'Testing...' : 'Test'}
                </Button>
              </div>

              {/* Validation Result */}
              {validationResult !== null && (
                <Alert variant={validationResult ? 'default' : 'destructive'}>
                  {validationResult ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {validationResult
                      ? 'API key is valid and working!'
                      : 'API key validation failed. Please check your key.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Advanced Settings */}
            {provider === 'openai' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`${provider}-organization`} className="text-sm font-medium">
                    Organization ID (Optional)
                  </Label>
                  <Input
                    id={`${provider}-organization`}
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, organization: e.target.value }))
                    }
                    placeholder="org-..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${provider}-project`} className="text-sm font-medium">
                    Project ID (Optional)
                  </Label>
                  <Input
                    id={`${provider}-project`}
                    value={formData.project}
                    onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
                    placeholder="proj_..."
                  />
                </div>
              </>
            )}

            {/* Custom Base URL */}
            <div className="space-y-2">
              <Label htmlFor={`${provider}-base-url`} className="text-sm font-medium">
                Custom Base URL (Optional)
              </Label>
              <Input
                id={`${provider}-base-url`}
                value={formData.baseUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.example.com/v1"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={!formData.apiKey.trim() || isSaving} size="sm">
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button variant="outline" onClick={handleCancel} size="sm">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Current Status */}
            {isConfigured ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircleIcon className="w-4 h-4" />
                <span>Provider is configured and ready to use</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <KeyIcon className="w-4 h-4" />
                <span>API key required to use {title} models</span>
              </div>
            )}

            {/* Configure Button */}
            <Button
              variant={isConfigured ? 'outline' : 'default'}
              onClick={() => setIsEditing(true)}
              size="sm"
              className="w-full"
            >
              {isConfigured ? 'Update Configuration' : 'Configure Provider'}
            </Button>
          </div>
        )}

        {/* Available Models List */}
        {models.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-medium text-gray-700 mb-2">Available Models:</div>
            <div className="flex flex-wrap gap-1">
              {models.slice(0, 3).map((model) => (
                <Badge key={model.id} variant="outline" className="text-xs">
                  {model.name}
                </Badge>
              ))}
              {models.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{models.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
