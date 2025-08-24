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
import { Label } from '@/components/ui/label';
import { Sparkles, Zap } from 'lucide-react';
import AIGenerationLoader, { AILoaderPresets } from '@/components/ui/AIGenerationLoader';
import { toast } from 'sonner';
import { streamHandler, StreamChunk } from '@/lib/utils/streamHandler';

interface ContractRefineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onContentRefined: (refinedContent: string) => void;
  onStreamingContent?: (content: string) => void;
}

type RefineState = 'idle' | 'analyzing';

export default function ContractRefineModal({
  open,
  onOpenChange,
  content,
  onContentRefined,
  onStreamingContent,
}: ContractRefineModalProps) {
  const [refineState, setRefineState] = useState<RefineState>('idle');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');

  const handleRefine = async () => {
    streamHandler.reset();

    try {
      const response = await fetch('/api/contracts/ai-enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          additionalInstructions: additionalInstructions.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine contract content');
      }

      // Close modal immediately when streaming starts for better UX
      onOpenChange(false);

      // Handle streaming response
      await streamHandler.handleClientStream(response, {
        onChunk: (chunk: StreamChunk) => {
          if (chunk.content) {
            // Send streaming content to parent component for real-time updates
            onStreamingContent?.(chunk.content);
          }
        },
        onComplete: (finalContent: string) => {
          // Apply the refined content
          onContentRefined(finalContent);
          toast.success('Contract refined successfully!');
        },
        onError: (error: Error) => {
          console.error('Error refining contract:', error);
          toast.error('Failed to refine contract. Please try again.');
        },
      });
    } catch (error) {
      console.error('Error refining contract:', error);
      toast.error('Failed to refine contract. Please try again.');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setAdditionalInstructions('');
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
            <div className="space-y-6">
              <div className="py-4">
                <AIGenerationLoader {...AILoaderPresets.contractRefinement} size="lg" />
              </div>

              <div className="text-center">
                <h4 className="text-sm font-medium text-blue-600 mb-2">
                  AI is enhancing your contract...
                </h4>
                <p className="text-xs text-muted-foreground">
                  The modal will close automatically when refinement is complete.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">
                  Ready to refine your contract
                </h4>
                <p className="text-xs text-muted-foreground">
                  Click &ldquo;Refine with AI&rdquo; to start the enhancement process.
                </p>
              </div>
            </div>
          )}

          {/* What AI Will Do */}
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

          {/* Additional Instructions */}
          <div className="space-y-3">
            <Label htmlFor="additional-instructions" className="text-sm font-medium">
              Additional Instructions (Optional)
            </Label>
            <textarea
              id="additional-instructions"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="Tell us what specific aspects you'd like to refine. For example: 'Make the language more formal', 'Add more specific terms', 'Simplify the language', etc."
              className="w-full min-h-[80px] p-3 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={refineState === 'analyzing'}
            />
            <p className="text-xs text-muted-foreground">
              These instructions will help AI provide more targeted improvements to your contract.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={refineState === 'analyzing'}>
            Cancel
          </Button>

          <Button onClick={handleRefine} disabled={!content.trim()}>
            <Sparkles className="h-4 w-4 mr-2" />
            Refine with AI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
