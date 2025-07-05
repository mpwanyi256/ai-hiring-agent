import { createAsyncThunk } from "@reduxjs/toolkit";
import api, { apiUtils } from '../api';
import { JobData } from "@/lib/services/jobsService";
import { APIResponse, CandidateBasic, getCandidateDetailsPayload } from "@/types";

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
  }: getCandidateDetailsPayload): Promise<CandidateBasic> => {
    const response = await apiUtils.post(`/api/candidates`, {
      jobToken,
      email,
      firstName,
      lastName,
    });

    console.log('candidate details', response);

    if (!response.ok) {
      throw new Error('Failed to fetch candidate details')
    }

    const { data } = await response.json() as APIResponse<CandidateBasic>

    return data
  }
)