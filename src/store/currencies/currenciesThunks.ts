import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { Currency } from '@/types/currency';

// Fetch all currencies
export const fetchCurrencies = createAsyncThunk('currencies/fetchCurrencies', async () => {
  try {
    const response = await apiUtils.get<Currency[]>('/api/currencies');
    return response;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch currencies');
  }
});
