import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Currency, CurrenciesState } from '@/types/currency';
import { fetchCurrencies } from './currenciesThunks';

const initialState: CurrenciesState = {
  currencies: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

const currenciesSlice = createSlice({
  name: 'currencies',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrencies: (state) => {
      state.currencies = [];
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Currencies
      .addCase(fetchCurrencies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action: PayloadAction<Currency[]>) => {
        state.isLoading = false;
        state.currencies = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch currencies';
      });
  },
});

export const { clearError, clearCurrencies } = currenciesSlice.actions;
export default currenciesSlice.reducer;
