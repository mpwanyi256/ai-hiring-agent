import React from 'react';
import { cn } from '@/lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl w-full mx-4 max-h-[90vh] overflow-y-auto relative',
          size === 'sm'
            ? 'max-w-sm'
            : size === 'md'
              ? 'max-w-md'
              : size === 'lg'
                ? 'max-w-lg'
                : 'max-w-xl',
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        {title && (
          <div className="px-6 pt-6 pb-2 text-lg font-semibold border-b border-gray-200">
            {title}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
