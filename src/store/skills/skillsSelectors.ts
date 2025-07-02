import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';
import { Skill } from '@/types/jobs';

// Basic selectors
export const selectSkills = (state: RootState) => state.skills;
export const selectSkillsData = (state: RootState) => state.skills.skills;
export const selectSkillsLoading = (state: RootState) => state.skills.isLoading;
export const selectSkillsError = (state: RootState) => state.skills.error;
export const selectSkillsLastFetched = (state: RootState) => state.skills.lastFetched;

// Memoized selectors
export const selectSkillsByCategory = createSelector(
  [selectSkillsData],
  (skills: Skill[]) => {
    const skillsByCategory: Record<string, Skill[]> = {};
    
    skills.forEach((skill: Skill) => {
      const category = skill.category || 'Other';
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = [];
      }
      skillsByCategory[category].push(skill);
    });
    
    return skillsByCategory;
  }
);

export const selectActiveSkills = createSelector(
  [selectSkillsData],
  (skills: Skill[]) => skills.filter((skill: Skill) => skill.name) // Since there's no isActive field in the existing type
);

export const selectSkillsCount = createSelector(
  [selectSkillsData],
  (skills: Skill[]) => skills.length
);

export const selectSkillById = createSelector(
  [selectSkillsData, (state: RootState, skillId: string) => skillId],
  (skills: Skill[], skillId: string) => skills.find((skill: Skill) => skill.id === skillId)
);

export const selectSkillsByIds = createSelector(
  [selectSkillsData, (state: RootState, skillIds: string[]) => skillIds],
  (skills: Skill[], skillIds: string[]) => skills.filter((skill: Skill) => skillIds.includes(skill.id))
); 