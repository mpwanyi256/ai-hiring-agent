import { configureStore } from '@reduxjs/toolkit';
import authSlice from '@/store/slices/authSlice';
import jobsSlice from '@/store/slices/jobsSlice';
import candidatesSlice from '@/store/slices/candidatesSlice';
import { useDispatch, useSelector } from 'react-redux';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    jobs: jobsSlice,
    candidates: candidatesSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector;