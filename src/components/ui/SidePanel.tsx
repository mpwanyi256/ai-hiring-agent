import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const widthMap = {
  sm: 'max-w-xs',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'md',
}) => {
  if (!isOpen) return null;
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-0 right-0 z-50 h-full bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300',
            'w-full',
            widthMap[width] || widthMap.md,
          )}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="text-lg font-semibold">{title}</div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default SidePanel;
