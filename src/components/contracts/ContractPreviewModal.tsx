'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ContractPreviewModalProps {
  contract: {
    title: string;
    body: string;
    jobTitle?: { name: string };
    employmentType?: { name: string };
    contractDuration?: string;
    category: string;
    status: string;
  };
  trigger?: React.ReactNode;
}

export default function ContractPreviewModal({ contract, trigger }: ContractPreviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopyContent = async () => {
    if (!mounted || typeof window === 'undefined') {
      toast.error('Copy not available');
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(contract.body);
        toast.success('Contract content copied to clipboard');
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = contract.body;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Contract content copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to copy content');
    }
  };

  const handleDownload = () => {
    if (!mounted || typeof window === 'undefined') {
      toast.error('Download not available');
      return;
    }

    try {
      const element = document.createElement('a');
      const file = new Blob([contract.body], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${contract.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_contract.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Contract downloaded');
    } catch (error) {
      toast.error('Failed to download contract');
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="h-4 w-4 mr-2" />
      Preview
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[90vw] lg:w-[75vw] lg:max-w-[75vw] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{contract.title}</DialogTitle>
              <DialogDescription className="mt-1">
                Contract preview - {contract.jobTitle?.name && `${contract.jobTitle.name} • `}
                {contract.employmentType?.name && `${contract.employmentType.name} • `}
                {contract.contractDuration && `${contract.contractDuration} • `}
                {contract.category} • {contract.status}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyContent} disabled={!mounted}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!mounted}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: contract.body }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
