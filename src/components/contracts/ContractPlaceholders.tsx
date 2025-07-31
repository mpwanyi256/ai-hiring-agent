'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ContractPlaceholder } from '@/types/contracts';
import { Plus, Search, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ContractPlaceholdersProps {
  onInsertPlaceholder: (placeholder: string) => void;
}

// Define all available contract placeholders
const AVAILABLE_PLACEHOLDERS: ContractPlaceholder[] = [
  {
    key: 'candidate_name',
    label: 'Candidate Name',
    description: 'Full name of the candidate',
    example: 'John Smith',
  },
  {
    key: 'candidate_email',
    label: 'Candidate Email',
    description: 'Email address of the candidate',
    example: 'john.smith@email.com',
  },
  {
    key: 'job_title',
    label: 'Job Title',
    description: 'Position title for the role',
    example: 'Senior Software Engineer',
  },
  {
    key: 'company_name',
    label: 'Company Name',
    description: 'Name of the hiring company',
    example: 'Acme Corporation',
  },
  {
    key: 'start_date',
    label: 'Start Date',
    description: 'Employment start date',
    example: '01/15/2024',
  },
  {
    key: 'end_date',
    label: 'End Date',
    description: 'Employment end date (if applicable)',
    example: '01/15/2025',
  },
  {
    key: 'salary_amount',
    label: 'Salary Amount',
    description: 'Salary amount (formatted with commas)',
    example: '75,000',
  },
  {
    key: 'salary_currency',
    label: 'Salary Currency',
    description: 'Currency for the salary',
    example: 'USD',
  },
  {
    key: 'contract_duration',
    label: 'Contract Duration',
    description: 'Duration of the contract',
    example: '12 months',
  },
  {
    key: 'employment_type',
    label: 'Employment Type',
    description: 'Type of employment',
    example: 'Full-time',
  },
  {
    key: 'signing_date',
    label: 'Signing Date',
    description: 'Date when the contract is signed',
    example: '12/01/2023',
  },
];

export default function ContractPlaceholders({ onInsertPlaceholder }: ContractPlaceholdersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter placeholders based on search term
  const filteredPlaceholders = AVAILABLE_PLACEHOLDERS.filter(
    (placeholder) =>
      placeholder.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placeholder.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placeholder.key.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleInsertPlaceholder = (key: string) => {
    const placeholderText = `{{ ${key} }}`;
    onInsertPlaceholder(placeholderText);
    setIsOpen(false);
    toast.success(`Inserted placeholder: ${placeholderText}`);
  };

  const handleCopyPlaceholder = (key: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const placeholderText = `{{ ${key} }}`;
    navigator.clipboard.writeText(placeholderText);
    toast.success(`Copied to clipboard: ${placeholderText}`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Placeholder
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4 border-b flex flex-col gap-2">
          <h3 className="font-semibold text-sm mb-2">Contract Placeholders</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Click to insert placeholders that will be replaced with actual values when contracts are
            generated.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search placeholders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filteredPlaceholders.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No placeholders found matching &ldquo;{searchTerm}&rdquo;
            </div>
          ) : (
            <div className="p-2">
              {filteredPlaceholders.map((placeholder) => (
                <div
                  key={placeholder.key}
                  className="flex items-start justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                  onClick={() => handleInsertPlaceholder(placeholder.key)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col items-start gap-2">
                      <span className="font-medium text-sm">{placeholder.label}</span>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {`{{ ${placeholder.key} }}`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{placeholder.description}</p>
                    <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      Example: {placeholder.example}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-8 w-8 p-0"
                    onClick={(e) => handleCopyPlaceholder(placeholder.key, e)}
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">
            💡 Tip: You can also type placeholders manually using the format{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">{`{{ placeholder_name }}`}</code>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
