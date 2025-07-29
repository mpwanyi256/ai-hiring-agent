'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  buttonText: string;
  buttonVariant?: 'primary' | 'outline';
  href: string;
  onClick?: () => void;
}

export default function QuickActionCard({
  title,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  buttonText,
  buttonVariant = 'primary',
  href,
  onClick,
}: QuickActionCardProps) {
  const content = (
    <div className="group bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor} group-hover:scale-105 transition-transform`}
          >
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          </div>
        </div>
        <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
      </div>

      <div className="mt-auto">
        <Button size="sm" variant={buttonVariant} className="w-full text-xs" onClick={onClick}>
          {buttonText}
        </Button>
      </div>
    </div>
  );

  if (href && !onClick) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
