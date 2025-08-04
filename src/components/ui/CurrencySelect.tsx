'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { fetchCurrencies } from '@/store/currencies/currenciesThunks';
import {
  selectCurrencies,
  selectCurrenciesLoading,
  selectCurrenciesError,
} from '@/store/currencies/currenciesSelectors';

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  showLabel?: boolean;
  searchable?: boolean;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select currency',
  label = 'Currency',
  id,
  className = '',
  disabled = false,
  error,
  showLabel = true,
  searchable = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currencies = useSelector(selectCurrencies);
  const currenciesLoading = useSelector(selectCurrenciesLoading);
  const currenciesError = useSelector(selectCurrenciesError);

  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Load currencies on mount if not already loaded
  useEffect(() => {
    setIsMounted(true);
    if (currencies.length === 0) {
      dispatch(fetchCurrencies());
    }
  }, [dispatch, currencies.length]);

  // Filter currencies based on search term
  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());

    // Find and hide/show items based on search
    const items = document.querySelectorAll('[data-currency-item]');
    const searchValue = event.target.value.toLowerCase();

    items.forEach((item) => {
      const htmlItem = item as HTMLElement;
      const text = htmlItem.textContent?.toLowerCase() || '';
      htmlItem.style.display = text.includes(searchValue) ? 'block' : 'none';
    });
  };

  // Get selected currency for display
  const selectedCurrency = currencies.find((currency) => currency.code === value);

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </Label>
      )}

      <Select value={value} onValueChange={onValueChange} disabled={disabled || currenciesLoading}>
        <SelectTrigger id={id} className={error ? 'border-red-300' : ''}>
          <SelectValue
            placeholder={isMounted && currenciesLoading ? 'Loading currencies...' : placeholder}
          >
            {isMounted && selectedCurrency ? (
              <span>
                {selectedCurrency.code} - {selectedCurrency.name}
              </span>
            ) : (
              value || placeholder
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] p-0">
          {searchable && (
            <div className="sticky top-0 z-10 p-2 bg-background border-b shadow-sm">
              <Input
                placeholder="Search currencies..."
                className="h-8"
                onChange={handleSearchChange}
              />
            </div>
          )}

          <div className="max-h-[240px] overflow-y-auto">
            {isMounted && currenciesLoading ? (
              <SelectItem value="loading" disabled>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading currencies...
                </div>
              </SelectItem>
            ) : isMounted && currenciesError ? (
              <SelectItem value="error" disabled>
                <div className="text-red-600 text-sm">Error loading currencies</div>
              </SelectItem>
            ) : filteredCurrencies.length === 0 ? (
              <SelectItem value="empty" disabled>
                No currencies found
              </SelectItem>
            ) : (
              filteredCurrencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.code} data-currency-item>
                  <div className="flex items-center gap-2">
                    <span>{currency.code}</span>
                    <span className="text-gray-500">- {currency.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CurrencySelect;
