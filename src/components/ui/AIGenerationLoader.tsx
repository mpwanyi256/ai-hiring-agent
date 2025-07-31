'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Zap, FileText, Wand2 } from 'lucide-react';

interface AIGenerationLoaderProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const loadingMessages = [
  'Analyzing your requirements...',
  'Generating professional content...',
  'Optimizing language and structure...',
  'Adding dynamic placeholders...',
  'Finalizing your contract...',
];

const submessages = [
  'This may take a few moments',
  'Creating something amazing',
  'AI is working its magic',
  'Almost ready...',
  'Putting finishing touches',
];

export default function AIGenerationLoader({
  message,
  submessage,
  size = 'md',
  className = '',
}: AIGenerationLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentSubmessageIndex, setCurrentSubmessageIndex] = useState(0);

  // Cycle through messages
  useEffect(() => {
    if (!message) {
      const messageInterval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
      return () => clearInterval(messageInterval);
    }
  }, [message]);

  // Cycle through submessages
  useEffect(() => {
    if (!submessage) {
      const submessageInterval = setInterval(() => {
        setCurrentSubmessageIndex((prev) => (prev + 1) % submessages.length);
      }, 3000);
      return () => clearInterval(submessageInterval);
    }
  }, [submessage]);

  const sizeClasses = {
    sm: {
      container: 'p-4',
      iconSize: 'h-8 w-8',
      mainText: 'text-sm',
      subText: 'text-xs',
      spacing: 'space-y-2',
    },
    md: {
      container: 'p-6',
      iconSize: 'h-12 w-12',
      mainText: 'text-base',
      subText: 'text-sm',
      spacing: 'space-y-3',
    },
    lg: {
      container: 'p-8',
      iconSize: 'h-16 w-16',
      mainText: 'text-lg',
      subText: 'text-base',
      spacing: 'space-y-4',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={`flex flex-col items-center justify-center ${currentSize.container} ${className}`}
    >
      {/* Animated Icon Container */}
      <div className="relative mb-4">
        {/* Main pulsing circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse" />

        {/* Rotating outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
          <div className="absolute inset-1 rounded-full bg-background" />
        </div>

        {/* Floating icons around the center */}
        <div className="relative flex items-center justify-center">
          {/* Center Brain Icon */}
          <div
            className={`${currentSize.iconSize} relative z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg`}
          >
            <Brain className="h-1/2 w-1/2 animate-pulse" />
          </div>

          {/* Floating Sparkles */}
          <Sparkles
            className="absolute -top-2 -right-2 h-4 w-4 text-yellow-400 animate-bounce"
            style={{ animationDelay: '0s' }}
          />
          <Zap
            className="absolute -bottom-2 -left-2 h-4 w-4 text-blue-400 animate-bounce"
            style={{ animationDelay: '0.5s' }}
          />
          <FileText
            className="absolute -top-2 -left-2 h-4 w-4 text-green-400 animate-bounce"
            style={{ animationDelay: '1s' }}
          />
          <Wand2
            className="absolute -bottom-2 -right-2 h-4 w-4 text-purple-400 animate-bounce"
            style={{ animationDelay: '1.5s' }}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className={`text-center ${currentSize.spacing}`}>
        <div
          className={`font-semibold text-foreground ${currentSize.mainText} transition-all duration-500 ease-in-out`}
        >
          {message || loadingMessages[currentMessageIndex]}
        </div>
        <div
          className={`text-muted-foreground ${currentSize.subText} transition-all duration-500 ease-in-out`}
        >
          {submessage || submessages[currentSubmessageIndex]}
        </div>
      </div>

      {/* Animated Dots */}
      <div className="flex space-x-1 mt-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

// Preset configurations for common use cases
export const AILoaderPresets = {
  contractGeneration: {
    message: 'Generating your contract...',
    submessage: 'Creating professional legal content with AI',
  },
  contractEnhancement: {
    message: 'Enhancing your contract...',
    submessage: 'Improving grammar and adding placeholders',
  },
  pdfExtraction: {
    message: 'Extracting content from PDF...',
    submessage: 'Processing document with AI assistance',
  },
  contractRefinement: {
    message: 'Refining contract template...',
    submessage: 'Optimizing language and structure',
  },
};
