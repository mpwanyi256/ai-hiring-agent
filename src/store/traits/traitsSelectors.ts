import { RootState } from '../index';
import { createSelector } from '@reduxjs/toolkit';
import { Trait } from '@/types/jobs';

// Basic selectors
export const selectTraits = (state: RootState) => state.traits;
export const selectTraitsData = (state: RootState) => state.traits.traits;
export const selectTraitsLoading = (state: RootState) => state.traits.isLoading;
export const selectTraitsError = (state: RootState) => state.traits.error;
export const selectTraitsLastFetched = (state: RootState) => state.traits.lastFetched;

// Memoized selectors
export const selectTraitsByCategory = createSelector(
  [selectTraitsData],
  (traits: Trait[]) => {
    const traitsByCategory: Record<string, Trait[]> = {};
    
    traits.forEach(trait => {
      const category = trait.category || 'Other';
      if (!traitsByCategory[category]) {
        traitsByCategory[category] = [];
      }
      traitsByCategory[category].push(trait);
    });
    
    return traitsByCategory;
  }
);

export const selectActiveTraits = createSelector(
  [selectTraitsData],
  (traits: Trait[]) => traits.filter((trait: Trait) => trait.name)
);

export const selectTraitsCount = createSelector(
  [selectTraitsData],
  (traits: Trait[]) => traits.length
);

export const selectTraitById = createSelector(
  [selectTraitsData, (state: RootState, traitId: string) => traitId],
  (traits: Trait[], traitId: string) => traits.find(trait => trait.id === traitId)
);

export const selectTraitsByIds = createSelector(
  [selectTraitsData, (state: RootState, traitIds: string[]) => traitIds],
  (traits: Trait[], traitIds: string[]) => traits.filter(trait => traitIds.includes(trait.id))
); 