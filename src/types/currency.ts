export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
}

export interface CurrenciesState {
  currencies: Currency[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}
