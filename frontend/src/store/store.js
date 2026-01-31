import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Add slices here as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});