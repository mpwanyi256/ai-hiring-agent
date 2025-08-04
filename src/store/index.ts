import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

// Import all slices
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
import teamsSlice from './teams/teamsSlice';
import jobPermissionsSlice from './jobPermissions/jobPermissionsSlice';
import messagesSlice from './messages/messagesSlice';
import adminSlice from './admin/adminSlice';
import contractsSlice from './contracts/contractsSlice';
import aiSlice from './ai/aiSlice';
import notificationsSlice from './notifications/notificationsSlice';
import currenciesSlice from './currencies/currenciesSlice';
import settingsSlice from './settings/settingsSlice';

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
  contracts: contractsSlice,
  notifications: notificationsSlice,
  ai: aiSlice,
  currencies: currenciesSlice,
  settings: settingsSlice,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
