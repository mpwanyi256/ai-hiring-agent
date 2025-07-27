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
import interviewsSlice from './interviews/interviewsSlice';
import selectedCandidateSlice from './selectedCandidate/selectedCandidateSlice';
import companySlice from './company/companySlice';
import dashboardReducer from './dashboard/dashboardSlice';
import landingSlice from './landing/landingSlice';
import billingSlice from './billing/billingSlice';
import integrationsReducer from './integrations/integrationsSlice';
import { combineReducers } from 'redux';
import teamsSlice from './teams/teamsSlice';
import jobPermissionsSlice from './jobPermissions/jobPermissionsSlice';
import messagesSlice from './messages/messagesSlice';
import adminSlice from './admin/adminSlice';

const rootReducer = combineReducers({
  auth: authSlice,
  jobs: jobsSlice,
  candidates: candidatesSlice,
  evaluation: evaluationSlice,
  skills: skillsSlice,
  traits: traitsSlice,
  jobTemplates: jobTemplatesSlice,
  interview: interviewSlice,
  interviews: interviewsSlice,
  selectedCandidate: selectedCandidateSlice,
  company: companySlice,
  dashboard: dashboardReducer,
  landing: landingSlice,
  billing: billingSlice,
  integrations: integrationsReducer,
  teams: teamsSlice,
  jobPermissions: jobPermissionsSlice,
  messages: messagesSlice,
  admin: adminSlice,
});

export const store = configureStore({
  reducer: rootReducer,
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
