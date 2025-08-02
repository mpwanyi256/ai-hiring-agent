'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LockClosedIcon, ArrowUpIcon, SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getCurrentPlanName } from '@/lib/utils/subscriptionUtils';
import { User } from '@/types';

interface UpgradePromptProps {
  user: User | null;
  featureName: string;
  featureDescription: string;
  benefits: string[];
  className?: string;
  showCurrentPlan?: boolean;
}

export default function UpgradePrompt({
  user,
  featureName,
  featureDescription,
  benefits,
  className = '',
  showCurrentPlan = true,
}: UpgradePromptProps) {
  const router = useRouter();
  const currentPlan = getCurrentPlanName(user);

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with current plan badge */}
      {showCurrentPlan && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{featureName}</h1>
            <p className="text-sm text-gray-600">{featureDescription}</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <LockClosedIcon className="w-4 h-4" />
            {currentPlan} Plan
          </Badge>
        </div>
      )}

      {/* Main upgrade card */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
              <LockClosedIcon className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-amber-900 text-xl">Upgrade Required</CardTitle>
              <CardDescription className="text-amber-700 text-base">
                {featureName} is available for Pro and Business plans
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-amber-900">Current Plan</p>
              <p className="text-lg font-bold text-amber-800">{currentPlan}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Benefits list */}
          <div className="space-y-4">
            <p className="text-amber-900 font-medium">With Pro or Business plans, you can:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-1 bg-amber-200 rounded-full mt-0.5">
                    <CheckIcon className="w-3 h-3 text-amber-700" />
                  </div>
                  <p className="text-sm text-amber-800 leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="pt-6 border-t border-amber-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900">
                  Ready to unlock these features?
                </p>
                <p className="text-xs text-amber-700">Choose a plan that fits your needs</p>
              </div>
              <Button
                onClick={handleUpgradeClick}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <ArrowUpIcon className="w-4 h-4 mr-2" />
                View Pricing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
