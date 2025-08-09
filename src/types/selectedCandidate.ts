import { AnalyticsData } from './analytics';
import { Candidate } from './candidates';

export interface SelectedCandidateState {
  candidate: Candidate | null;
  candidateAnalytics: AnalyticsData | null;
  isLoading: boolean;
}
