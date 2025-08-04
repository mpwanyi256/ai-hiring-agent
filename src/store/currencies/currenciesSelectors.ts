import { RootState } from '../index';
import { Currency } from '@/types/currency';

export const selectCurrencies = (state: RootState) => state.currencies.currencies;
export const selectCurrenciesLoading = (state: RootState) => state.currencies.isLoading;
export const selectCurrenciesError = (state: RootState) => state.currencies.error;
export const selectCurrenciesLastFetched = (state: RootState) => state.currencies.lastFetched;

export const selectCurrencyByCode = (state: RootState, code: string): Currency | undefined =>
  state.currencies.currencies.find((currency: Currency) => currency.code === code);
