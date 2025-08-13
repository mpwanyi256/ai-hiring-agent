import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenTool, Type, Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import { SignatureData } from '@/types/contracts';

interface SignatureDisplayProps {
  signature: SignatureData;
  className?: string;
  compact?: boolean;
  showMetadata?: boolean;
}

const SignatureDisplay: React.FC<SignatureDisplayProps> = ({
  signature,
  className = '',
  compact = false,
  showMetadata = true,
}) => {
  if (!signature || (!signature.fullName && !signature.data)) {
    return null;
  }

  const renderSignature = () => {
    if (signature.type === 'drawn' && signature.data) {
      return (
        <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <Image
            src={signature.data}
            alt="Signature"
            width={200}
            height={64}
            className="max-h-16 max-w-full object-contain"
          />
        </div>
      );
    }

    if (signature.type === 'typed' && signature.fullName) {
      return (
        <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <span
            className="text-2xl font-serif italic text-gray-800"
            style={{ fontFamily: 'Brush Script MT, cursive' }}
          >
            {signature.fullName}
          </span>
        </div>
      );
    }

    return null;
  };

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          {signature.type === 'drawn' ? (
            <PenTool className="h-4 w-4 text-blue-600" />
          ) : (
            <Type className="h-4 w-4 text-blue-600" />
          )}
          <span className="text-sm font-medium">
            {signature.type === 'drawn' ? 'Hand-drawn' : 'Typed'} signature
          </span>
          {signature.fullName && (
            <span className="text-sm text-gray-600">by {signature.fullName}</span>
          )}
        </div>
        {/* Render the actual signature content */}
        <div className="pl-6">{renderSignature()}</div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Signature Type Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {signature.type === 'drawn' ? (
                <PenTool className="h-4 w-4 text-blue-600" />
              ) : (
                <Type className="h-4 w-4 text-blue-600" />
              )}
              <span className="text-sm font-medium">Digital Signature</span>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {signature.type === 'drawn' ? 'Hand-drawn' : 'Typed'}
            </Badge>
          </div>

          {/* Signature Display */}
          {renderSignature()}

          {/* Metadata */}
          {showMetadata && (
            <div className="space-y-2 pt-3 border-t border-gray-100">
              {signature.fullName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-3 w-3" />
                  <span className="font-medium">Signed by:</span>
                  <span>{signature.fullName}</span>
                </div>
              )}
              {signature.signedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium">Signed on:</span>
                  <span>{formatDate(signature.signedAt)}</span>
                </div>
              )}
              {signature.ipAddress && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">IP:</span>
                  <span className="font-mono text-xs">{signature.ipAddress}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignatureDisplay;
