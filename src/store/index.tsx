// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import messengerReducer from "./messengerSlice";

export const store = configureStore({
  reducer: {
    messenger: messengerReducer,
    // Có thể thêm các reducers khác ở đây
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
