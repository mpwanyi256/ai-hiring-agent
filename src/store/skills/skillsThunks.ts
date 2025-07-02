import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { Skill } from '@/types/jobs';

// Fetch all skills
export const fetchSkills = createAsyncThunk(
  'skills/fetchSkills',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiUtils.get<{ skills: Skill[] }>('/api/skills');
      return response.skills;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch skills');
    }
  }
); 