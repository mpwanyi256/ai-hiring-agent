import React from 'react';
import { Button } from '@/components/ui/button';

interface CompanyFieldRowProps {
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
  className?: string;
  children?: React.ReactNode;
}

const CompanyFieldRow: React.FC<CompanyFieldRowProps> = ({
  label,
  value,
  onEdit,
  className = '',
  children,
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b last:border-b-0 ${className}`}
    >
      <label className="text-sm font-medium text-gray-700 w-28 shrink-0">{label}</label>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-sm text-gray-900 truncate flex-1">{children || value}</span>
        <Button variant="outline" size="sm" onClick={onEdit} className="ml-2">
          Edit
        </Button>
      </div>
    </div>
  );
};

export default CompanyFieldRow;
