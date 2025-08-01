'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Note: Using a simple tab implementation since @/components/ui/tabs may not exist
import { Card, CardContent } from '@/components/ui/card';
import { Pen, Type, RotateCcw, Check } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (signature: { type: 'typed' | 'drawn'; data: string; fullName: string }) => void;
  candidateName: string;
  isLoading?: boolean;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onSign,
  candidateName,
  isLoading = false,
}: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'typed' | 'drawn'>('typed');
  const [typedSignature, setTypedSignature] = useState(candidateName);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signatureData, setSignatureData] = useState<string>('');

  // Canvas drawing functionality
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 500;
    canvas.height = 200;

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Save signature data
    setSignatureData(canvas.toDataURL());
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleSign = () => {
    if (activeTab === 'typed') {
      if (!typedSignature.trim()) {
        return;
      }
      onSign({
        type: 'typed',
        data: typedSignature,
        fullName: typedSignature,
      });
    } else {
      if (!signatureData) {
        return;
      }
      onSign({
        type: 'drawn',
        data: signatureData,
        fullName: typedSignature || candidateName,
      });
    }
  };

  const isSignatureValid = () => {
    if (activeTab === 'typed') {
      return typedSignature.trim().length > 0;
    } else {
      return signatureData.length > 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pen className="h-5 w-5" />
            Sign Contract
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Please provide your signature to accept and sign this employment contract.
          </div>

          <div className="w-full">
            {/* Simple tab implementation */}
            <div className="flex w-full border-b">
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'typed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('typed')}
              >
                <Type className="h-4 w-4 inline mr-2" />
                Type Signature
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'drawn'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('drawn')}
              >
                <Pen className="h-4 w-4 inline mr-2" />
                Draw Signature
              </button>
            </div>

            {activeTab === 'typed' && (
              <div className="space-y-4 mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="typed-signature">Full Name</Label>
                        <Input
                          id="typed-signature"
                          value={typedSignature}
                          onChange={(e) => setTypedSignature(e.target.value)}
                          placeholder="Enter your full name"
                          className="mt-2"
                        />
                      </div>

                      {typedSignature && (
                        <div className="border-t pt-4">
                          <Label className="text-sm text-muted-foreground">Preview:</Label>
                          <div className="mt-2 p-4 border rounded-md bg-gray-50">
                            <div
                              className="text-2xl font-serif italic text-center"
                              style={{ fontFamily: 'Brush Script MT, cursive' }}
                            >
                              {typedSignature}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'drawn' && (
              <div className="space-y-4 mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input
                          id="full-name"
                          value={typedSignature}
                          onChange={(e) => setTypedSignature(e.target.value)}
                          placeholder="Enter your full name"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Draw your signature in the box below:
                        </Label>
                        <div className="mt-2 border rounded-md p-4 bg-white">
                          <canvas
                            ref={canvasRef}
                            className="border border-dashed border-gray-300 cursor-crosshair w-full"
                            style={{ maxWidth: '100%', height: '200px' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <div className="text-xs text-muted-foreground">
                              Click and drag to draw your signature
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearCanvas}
                              className="flex items-center gap-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Clear
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSign}
              disabled={!isSignatureValid() || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Accept & Sign Contract
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
