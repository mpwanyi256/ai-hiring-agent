'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, AlertTriangle, Loader2, AlertCircle, Zap } from 'lucide-react';
import AIGenerationLoader, { AILoaderPresets } from '@/components/ui/AIGenerationLoader';
import { toast } from 'sonner';

interface ContractRefineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onContentRefined: (refinedContent: string) => void;
}

type RefineState = 'idle' | 'analyzing' | 'success' | 'error';

interface RefineResult {
  enhancedContent: string;
  improvements: string[];
  placeholdersAdded: string[];
  originalLength: number;
  enhancedLength: number;
}

export default function ContractRefineModal({
  open,
  onOpenChange,
  content,
  onContentRefined,
}: ContractRefineModalProps) {
  const [refineState, setRefineState] = useState<RefineState>('idle');
  const [refineResult, setRefineResult] = useState<RefineResult | null>(null);

  const handleRefine = async () => {
    setRefineState('analyzing');

    try {
      const response = await fetch('/api/contracts/ai-enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine contract content');
      }

      const data = await response.json();

      setRefineState('success');
      setRefineResult(data);

      toast.success('Contract refined successfully!');
    } catch (error) {
      console.error('Error refining contract:', error);
      setRefineState('error');
      toast.error('Failed to refine contract. Please try again.');
    }
  };

  const handleApplyChanges = () => {
    if (refineResult) {
      onContentRefined(refineResult.enhancedContent);
      onOpenChange(false);
      resetModal();
      toast.success('Refined content applied to your contract!');
    }
  };

  const resetModal = () => {
    setRefineState('idle');
    setRefineResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetModal();
  };

  const getStateIcon = () => {
    switch (refineState) {
      case 'analyzing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  const getStateMessage = () => {
    switch (refineState) {
      case 'analyzing':
        return 'Analyzing and refining your contract...';
      case 'success':
        return 'Contract refined successfully!';
      case 'error':
        return 'Failed to refine contract. Please try again.';
      default:
        return 'Ready to refine your contract';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Refine Contract Template
          </DialogTitle>
          <DialogDescription>
            Use AI to improve your contract template with better grammar, spelling, and placeholder
            placement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Show creative loader during analysis */}
          {refineState === 'analyzing' ? (
            <div className="py-8">
              <AIGenerationLoader {...AILoaderPresets.contractRefinement} size="lg" />
            </div>
          ) : (
            /* Current State */
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              {getStateIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium">{getStateMessage()}</p>
                {refineState === 'idle' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Content length: {content.length.toLocaleString()} characters
                  </p>
                )}
              </div>
            </div>
          )}

          {/* What AI Will Do */}
          {refineState === 'idle' && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>AI will analyze and improve:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>
                    • <strong>Grammar & Spelling:</strong> Fix grammatical errors and typos
                  </li>
                  <li>
                    • <strong>Placeholder Optimization:</strong> Replace static content with dynamic
                    placeholders
                  </li>
                  <li>
                    • <strong>Formatting:</strong> Improve spacing, punctuation, and structure
                  </li>
                  <li>
                    • <strong>Consistency:</strong> Ensure consistent terminology throughout
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {refineState === 'success' && refineResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Improvements Made</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {refineResult.improvements.length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Placeholders Added</p>
                  <p className="text-2xl font-bold text-green-600">
                    {refineResult.placeholdersAdded.length}
                  </p>
                </div>
              </div>

              {/* Improvements List */}
              {refineResult.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Improvements Applied:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {refineResult.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span>{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Placeholders Added */}
              {refineResult.placeholdersAdded.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Placeholders Added:</h4>
                  <div className="flex flex-wrap gap-1">
                    {refineResult.placeholdersAdded.map((placeholder, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Refined Content Preview:</h4>
                <div className="max-h-40 overflow-y-auto p-3 bg-muted rounded-lg text-sm font-mono">
                  {refineResult.enhancedContent.substring(0, 500)}
                  {refineResult.enhancedContent.length > 500 && (
                    <span className="text-muted-foreground">
                      ... ({(refineResult.enhancedContent.length - 500).toLocaleString()} more
                      characters)
                    </span>
                  )}
                </div>
              </div>

              {/* Length Comparison */}
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted p-2 rounded">
                <span>Original: {refineResult.originalLength.toLocaleString()} chars</span>
                <span>•</span>
                <span>Refined: {refineResult.enhancedLength.toLocaleString()} chars</span>
                <span>•</span>
                <span
                  className={
                    refineResult.enhancedLength > refineResult.originalLength
                      ? 'text-blue-600'
                      : 'text-green-600'
                  }
                >
                  {refineResult.enhancedLength > refineResult.originalLength ? '+' : ''}
                  {refineResult.enhancedLength - refineResult.originalLength} chars
                </span>
              </div>
            </div>
          )}

          {/* Error State */}
          {refineState === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to refine the contract. This could be due to:
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Network connectivity issues</li>
                  <li>• Content too long or complex</li>
                  <li>• Temporary service unavailability</li>
                </ul>
                Please try again in a moment.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={refineState === 'analyzing'}>
            Cancel
          </Button>

          {refineState === 'idle' && (
            <Button onClick={handleRefine} disabled={!content.trim()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Refine with AI
            </Button>
          )}

          {refineState === 'success' && refineResult && (
            <Button onClick={handleApplyChanges}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          )}

          {refineState === 'error' && (
            <Button onClick={handleRefine}>
              <Sparkles className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
