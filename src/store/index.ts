import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authSlice from './auth/authSlice';
import jobsSlice from './jobs/jobsSlice';
import candidatesSlice from './candidates/candidatesSlice';
import evaluationSlice from './evaluation/evaluationSlice';
import skillsSlice from './skills/skillsSlice';
import traitsSlice from './traits/traitsSlice';
import jobTemplatesSlice from './jobTemplates/jobTemplatesSlice';
import interviewSlice from './interview/interviewSlice';
import selectedCandidateSlice from './selectedCandidate/selectedCandidateSlice';
import companySlice from './company/companySlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    jobs: jobsSlice,
    candidates: candidatesSlice,
    evaluation: evaluationSlice,
    skills: skillsSlice,
    traits: traitsSlice,
    jobTemplates: jobTemplatesSlice,
    interview: interviewSlice,
    selectedCandidate: selectedCandidateSlice,
    company: companySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export default store;
