'use client';

import { useEffect } from 'react';
import { useAppSelector } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { selectUsageRecords, selectTotalUsageCost, selectUsageByModel } from '@/store/ai/aiSlice';
import { DEFAULT_AI_MODELS } from '@/lib/ai/models';

export default function UsageAnalyticsCard() {
  const usageRecords = useAppSelector(selectUsageRecords);
  const totalCost = useAppSelector(selectTotalUsageCost);
  const usageByModel = useAppSelector(selectUsageByModel);

  // Calculate usage statistics
  const totalTokens = usageRecords.reduce((sum, record) => sum + record.tokensUsed, 0);
  const totalRequests = usageRecords.reduce((sum, record) => sum + record.requestCount, 0);
  const avgTokensPerRequest = totalRequests > 0 ? totalTokens / totalRequests : 0;

  // Get usage by capability
  const usageByCapability = usageRecords.reduce(
    (acc, record) => {
      if (!acc[record.capability]) {
        acc[record.capability] = { tokens: 0, cost: 0, requests: 0 };
      }
      acc[record.capability].tokens += record.tokensUsed;
      acc[record.capability].cost += record.cost;
      acc[record.capability].requests += record.requestCount;
      return acc;
    },
    {} as Record<string, { tokens: number; cost: number; requests: number }>,
  );

  // Get recent usage trend (last 7 days vs previous 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentUsage = usageRecords.filter((record) => new Date(record.timestamp) >= sevenDaysAgo);
  const previousUsage = usageRecords.filter(
    (record) =>
      new Date(record.timestamp) >= fourteenDaysAgo && new Date(record.timestamp) < sevenDaysAgo,
  );

  const recentCost = recentUsage.reduce((sum, record) => sum + record.cost, 0);
  const previousCost = previousUsage.reduce((sum, record) => sum + record.cost, 0);
  const costTrend = previousCost > 0 ? ((recentCost - previousCost) / previousCost) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getCapabilityLabel = (capability: string) => {
    return capability
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
                <div className="flex items-center gap-1 text-xs">
                  {costTrend >= 0 ? (
                    <ArrowTrendingUpIcon className="w-3 h-3 text-red-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-3 h-3 text-green-500" />
                  )}
                  <span className={costTrend >= 0 ? 'text-red-600' : 'text-green-600'}>
                    {Math.abs(costTrend).toFixed(1)}% vs last week
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-blue-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                <p className="text-2xl font-bold">{formatNumber(totalTokens)}</p>
                <p className="text-xs text-gray-500">Across all models</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-purple-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{formatNumber(totalRequests)}</p>
                <p className="text-xs text-gray-500">API calls made</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-orange-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Avg Tokens/Request</p>
                <p className="text-2xl font-bold">
                  {formatNumber(Math.round(avgTokensPerRequest))}
                </p>
                <p className="text-xs text-gray-500">Efficiency metric</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Model</CardTitle>
          <CardDescription>
            Token usage and costs broken down by AI model over the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(usageByModel).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No usage data available yet. Start using AI features to see analytics.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(usageByModel)
                .sort(([, a], [, b]) => b.cost - a.cost)
                .map(([modelId, usage]) => {
                  const model = DEFAULT_AI_MODELS.find((m) => m.id === modelId);
                  const costPercentage = totalCost > 0 ? (usage.cost / totalCost) * 100 : 0;

                  return (
                    <div key={modelId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model?.name || modelId}</span>
                          <Badge variant="outline" className="text-xs">
                            {model?.provider || 'unknown'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(usage.cost)}</div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(usage.tokens)} tokens • {usage.requests} requests
                          </div>
                        </div>
                      </div>
                      <Progress value={costPercentage} className="h-2" />
                      <div className="text-xs text-gray-500">
                        {costPercentage.toFixed(1)}% of total cost
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage by Capability */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Capability</CardTitle>
          <CardDescription>
            How AI models are being used across different features and capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(usageByCapability).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No capability usage data available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(usageByCapability)
                .sort(([, a], [, b]) => b.cost - a.cost)
                .map(([capability, usage]) => (
                  <div key={capability} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{getCapabilityLabel(capability)}</h4>
                      <Badge variant="outline">{usage.requests} requests</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cost:</span>
                        <span className="font-medium">{formatCurrency(usage.cost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tokens:</span>
                        <span className="font-medium">{formatNumber(usage.tokens)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg per request:</span>
                        <span className="font-medium">
                          {formatNumber(Math.round(usage.tokens / usage.requests))} tokens
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest AI model usage activity from the past 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsage.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent activity in the past 7 days.
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsage.slice(0, 10).map((record, index) => {
                const model = DEFAULT_AI_MODELS.find((m) => m.id === record.modelId);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{model?.name || record.modelId}</span>
                        <Badge variant="outline" className="text-xs">
                          {getCapabilityLabel(record.capability)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(record.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{formatCurrency(record.cost)}</div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(record.tokensUsed)} tokens
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentUsage.length > 10 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  And {recentUsage.length - 10} more activities...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
