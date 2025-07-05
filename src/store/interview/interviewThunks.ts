import { createAsyncThunk } from "@reduxjs/toolkit";
import api, { apiUtils } from '../api';
import { JobData } from "@/lib/services/jobsService";
import { APIResponse } from "@/types";

export const fetchInterview = createAsyncThunk(
  'interview/fetchInterview',
  async (token: string): Promise<JobData> => {
    const response = await fetch(`/api/jobs/interview/${token}`);

    if (!response.ok) {
      throw new Error('Failed to fetch interview')
    }

    const { data } = await response.json() as APIResponse<JobData>

    return data
  }
)
