import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface EditFieldModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  value: string;
  onSave: (newValue: string) => void;
  inputType?: 'text' | 'textarea';
  loading?: boolean;
  error?: string | null;
  richText?: boolean;
}

const EditFieldModal: React.FC<EditFieldModalProps> = ({
  open,
  onClose,
  label,
  value,
  onSave,
  inputType = 'text',
  loading = false,
  error = null,
  richText = false,
}) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value, open]);

  const handleSave = () => {
    if (!loading) onSave(inputValue);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={`Edit ${label}`}>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {richText ? (
          <RichTextEditor
            content={inputValue}
            onChange={setInputValue}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className="min-h-[180px]"
          />
        ) : inputType === 'textarea' ? (
          <textarea
            className="w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary text-sm p-2 min-h-[80px]"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            autoFocus
          />
        ) : (
          <input
            type="text"
            className="w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary text-sm p-2"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            autoFocus
          />
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={loading}
            disabled={inputValue === value || loading}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditFieldModal;
