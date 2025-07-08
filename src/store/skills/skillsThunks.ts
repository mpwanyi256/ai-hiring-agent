import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { Skill } from '@/types/jobs';

// Response type interface
interface SkillsResponse {
  skills: unknown[];
}

// Fetch all skills
export const fetchSkills = createAsyncThunk('skills/fetchSkills', async () => {
  try {
    const response = await apiUtils.get<SkillsResponse>('/api/skills');
    return response.skills;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch skills');
  }
});
