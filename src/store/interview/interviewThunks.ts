import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiUtils } from '../api';
import { JobData } from "@/lib/services/jobsService";
import { APIResponse, CandidateBasic } from "@/types";
import { createCandidateAccountPayload } from "@/types/interview";

export const fetchInterview = createAsyncThunk(
  'interview/fetchInterview',
  async (token: string): Promise<JobData> => {
    const response = await fetch(`/api/jobs/interview/${token}`);

    if (!response.ok) {
      throw new Error('Failed to fetch interview')
    }

    const data = await response.json() as APIResponse<JobData>

    return data.data;
  }
)

export const getCandidateDetails = createAsyncThunk(
  'interview/getCandidateDetails',
  async ({
    jobToken,
    email,
    firstName,
    lastName
  }: createCandidateAccountPayload): Promise<CandidateBasic> => {
    const { data, success } = await apiUtils.post<APIResponse<CandidateBasic>>(`/api/candidates`, {
      jobToken,
      email,
      firstName,
      lastName,
    });

    console.log('Candidate data returned', data);

    if (!success) {
      throw new Error('Failed to create candidate account')
    }

    return data
  }
)