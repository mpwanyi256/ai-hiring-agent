'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Copy, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ContractPlaceholder } from '@/types/contracts';
import { placeholderService } from '@/lib/services/placeholderService';

interface ContractPlaceholdersProps {
  onInsertPlaceholder: (placeholder: string) => void;
}

export default function ContractPlaceholders({ onInsertPlaceholder }: ContractPlaceholdersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [placeholders, setPlaceholders] = useState<ContractPlaceholder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch placeholders when component mounts or popover opens
  useEffect(() => {
    if (isOpen && placeholders.length === 0) {
      fetchPlaceholders();
    }
  }, [isOpen]);

  const fetchPlaceholders = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPlaceholders = await placeholderService.getPlaceholders();
      setPlaceholders(fetchedPlaceholders);
    } catch (err) {
      setError('Failed to load placeholders');
      console.error('Error fetching placeholders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter placeholders based on search term
  const filteredPlaceholders = placeholders.filter(
    (placeholder) =>
      placeholder.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placeholder.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placeholder.key.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Group placeholders by category
  const groupedPlaceholders = filteredPlaceholders.reduce(
    (acc, placeholder) => {
      const category = placeholder.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(placeholder);
      return acc;
    },
    {} as Record<string, ContractPlaceholder[]>,
  );

  const handleInsertPlaceholder = (key: string) => {
    const placeholderText = placeholderService.formatPlaceholder(key);
    onInsertPlaceholder(placeholderText);
    setIsOpen(false);
    toast.success(`Inserted placeholder: ${placeholderText}`);
  };

  const handleCopyPlaceholder = (key: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const placeholderText = placeholderService.formatPlaceholder(key);
    navigator.clipboard.writeText(placeholderText);
    toast.success(`Copied to clipboard: ${placeholderText}`);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      candidate: 'bg-blue-100 text-blue-800 border-blue-200',
      company: 'bg-green-100 text-green-800 border-green-200',
      job: 'bg-purple-100 text-purple-800 border-purple-200',
      compensation: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      dates: 'bg-orange-100 text-orange-800 border-orange-200',
      contract: 'bg-gray-100 text-gray-800 border-gray-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <Plus className="h-3 w-3" />
          Add Placeholder
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search placeholders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading placeholders...
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchPlaceholders} className="text-xs">
                Try Again
              </Button>
            </div>
          ) : Object.keys(groupedPlaceholders).length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchTerm
                ? 'No placeholders found matching your search.'
                : 'No placeholders available.'}
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedPlaceholders).map(([category, categoryPlaceholders]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {categoryPlaceholders.map((placeholder) => (
                      <div
                        key={placeholder.id}
                        onClick={() => handleInsertPlaceholder(placeholder.key)}
                        className="group flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">
                              {placeholder.label}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs px-1.5 py-0 ${getCategoryColor(placeholder.category)}`}
                            >
                              {placeholder.category}
                            </Badge>
                          </div>
                          {placeholder.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {placeholder.description}
                            </p>
                          )}
                          {placeholder.example && (
                            <p className="text-xs text-muted-foreground/70 italic mt-1">
                              e.g., {placeholder.example}
                            </p>
                          )}
                          <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                            {placeholderService.formatPlaceholder(placeholder.key)}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleCopyPlaceholder(placeholder.key, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
