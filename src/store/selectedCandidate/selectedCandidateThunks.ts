import { AnalyticsData } from '@/types/analytics';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Candidate } from '@/types/candidates';
import { ContractOffer } from '@/types/contracts';
import { apiUtils } from '../api';
import { APIResponse } from '@/types';

export const fetchSelectedCandidateAnalytics = createAsyncThunk<AnalyticsData>(
  'selectedCandidate/fetchSelectedCandidateAnalytics',
  async (_, { rejectWithValue, getState }) => {
    try {
      const selectedCandidate = (getState() as RootState).selectedCandidate.candidate;
      if (!selectedCandidate) {
        throw new Error('No candidate selected');
      }

      const { id: candidateId, jobId } = selectedCandidate;

      const response = await fetch(`/api/candidates/${candidateId}/analytics?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch candidate analytics');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const fetchSelectedCandidateDetails = createAsyncThunk<Candidate, string>(
  'selectedCandidate/fetchSelectedCandidateDetails',
  async (candidateId, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const jobId = state.jobs.currentJob?.id;
      if (!jobId) throw new Error('No job selected');

      const res = await fetch(`/api/jobs/${jobId}/candidates/${candidateId}`);
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to fetch candidate');
      }
      const payload = await res.json();
      return payload.candidate as Candidate;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : String(err));
    }
  },
);

export const fetchSelectedCandidateContractOffers = createAsyncThunk<ContractOffer[], void>(
  'selectedCandidate/fetchContractOffers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const selectedCandidate = state.selectedCandidate.candidate;
      if (!selectedCandidate) throw new Error('No candidate selected');

      const res = await apiUtils.get<APIResponse<ContractOffer[]>>(
        `/api/candidates/${selectedCandidate.id}/contract-offers`,
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : String(err));
    }
  },
);
