'use client';

import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { extractPDFContract } from '@/store/contracts/contractsThunks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import AIGenerationLoader, { AILoaderPresets } from '@/components/ui/AIGenerationLoader';
import { toast } from 'sonner';

interface UploadContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContentExtracted: (content: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'extracting' | 'success' | 'error' | 'enhancing';

// File size limit: 5MB (optimal balance between functionality and performance)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILE_SIZE_MB = 5;

export default function UploadContractModal({
  open,
  onOpenChange,
  onContentExtracted,
}: UploadContractModalProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState<string>('');
  const [useAiEnhancement, setUseAiEnhancement] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const isUploading =
    uploadState === 'uploading' || uploadState === 'extracting' || uploadState === 'enhancing';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
        return;
      }
      setSelectedFile(file);
      setUploadState('idle');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');

    try {
      // Use Redux thunk for PDF extraction
      const result = await dispatch(
        extractPDFContract({
          file: selectedFile,
          useAiEnhancement,
        }),
      );

      if (result.type === 'contracts/extractPDFContract/fulfilled') {
        const data = result.payload as {
          content: string;
          enhanced: boolean;
          filename: string;
          size: number;
        };

        setUploadState('success');
        setExtractedContent(data.content);

        toast.success('Contract content extracted successfully!');

        // Auto-close modal and pass content after a brief delay
        setTimeout(() => {
          onContentExtracted(data.content);
          onOpenChange(false);
          resetModal();
        }, 1500);
      } else {
        throw new Error('Failed to extract content from PDF');
      }
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      setUploadState('error');
      toast.error('Failed to extract content from PDF. Please try again.');
    }
  };

  const resetModal = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setExtractedContent('');
    setUseAiEnhancement(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetModal();
  };

  const getStateIcon = () => {
    switch (uploadState) {
      case 'uploading':
      case 'extracting':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStateMessage = () => {
    switch (uploadState) {
      case 'uploading':
        return 'Uploading contract...';
      case 'extracting':
        return 'Extracting content from PDF...';
      case 'success':
        return 'Content extracted successfully!';
      case 'error':
        return 'Failed to extract content. Please try again.';
      default:
        return 'Ready to upload';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Contract
          </DialogTitle>
          <DialogDescription>
            Upload an existing contract as a PDF to extract its content and create a template.
          </DialogDescription>
        </DialogHeader>

        {uploadState === 'extracting' ? (
          <div className="py-8">
            <AIGenerationLoader {...AILoaderPresets.pdfExtraction} size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <Label htmlFor="contract-file">Select Contract PDF</Label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  id="contract-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-fit"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose file
                </Button>
                {selectedFile && (
                  <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                )}
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  {getStateIcon()}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {getStateMessage()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Enhancement Option */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ai-enhancement"
                  checked={useAiEnhancement}
                  onChange={(e) => setUseAiEnhancement(e.target.checked)}
                  disabled={isUploading}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="ai-enhancement" className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4" />
                  Use AI to enhance template with placeholders
                </Label>
              </div>

              {useAiEnhancement && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    AI will automatically identify and replace relevant content with placeholders
                    like
                    <code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">
                      {'{{ candidate_name }}'}
                    </code>
                    ,
                    <code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">
                      {'{{ job_title }}'}
                    </code>
                    , etc.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Information Alert */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Upload Requirements & Limitations:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>
                    • <strong>File size:</strong> Maximum {MAX_FILE_SIZE_MB}MB
                  </li>
                  <li>
                    • <strong>Format:</strong> PDF files only
                  </li>
                  <li>
                    • <strong>Best results:</strong> Text-based PDFs work best
                  </li>
                  <li>
                    • <strong>⚠️ Image-heavy files:</strong> PDFs with many images, signatures, or
                    complex graphics may fail to process correctly
                  </li>
                </ul>

                <div className="mt-3 pt-2 border-t">
                  <strong>What we&apos;ll do:</strong>
                  <ul className="mt-1 space-y-1 text-sm">
                    <li>• Extract text content from your PDF contract</li>
                    <li>
                      • Replace specific values with placeholders like
                      <code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">
                        {'{{ candidate_name }}'}
                      </code>
                      ,
                      <code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">
                        {'{{ job_title }}'}
                      </code>
                      , etc.
                    </li>
                    <li>• Generate a reusable template for future contracts</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* Success Preview */}
            {uploadState === 'success' && extractedContent && (
              <div className="space-y-2">
                <Label>Extracted Content Preview</Label>
                <div className="max-h-32 overflow-y-auto p-3 bg-muted rounded-lg text-sm">
                  {extractedContent.substring(0, 300)}
                  {extractedContent.length > 300 && '...'}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadState === 'uploading' || uploadState === 'extracting'}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              !selectedFile ||
              uploadState === 'uploading' ||
              uploadState === 'extracting' ||
              uploadState === 'success'
            }
          >
            {uploadState === 'uploading' || uploadState === 'extracting' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadState === 'uploading' ? 'Uploading...' : 'Extracting...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Extract Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
