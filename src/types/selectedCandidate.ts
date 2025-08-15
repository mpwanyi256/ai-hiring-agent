import { AnalyticsData } from './analytics';
import { Candidate } from './candidates';
import { ContractOffer } from './contracts';

export interface SelectedCandidateState {
  candidate: Candidate | null;
  candidateAnalytics: AnalyticsData | null;
  isLoading: boolean;
  contractOffers: ContractOffer[] | null;
}
