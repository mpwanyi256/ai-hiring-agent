import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiUtils } from '../api';
import { Skill } from '@/types/jobs';

// Response type interfaces
interface SkillsResponse {
  skills: Skill[];
}

interface CreateSkillRequest {
  name: string;
  description?: string;
  categoryId?: string;
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

// Create new skill
export const createSkill = createAsyncThunk(
  'skills/createSkill',
  async (skillData: CreateSkillRequest) => {
    try {
      const response = await apiUtils.post<{ skill: Skill }>('/api/skills', skillData);
      return response.skill;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create skill');
    }
  },
);
