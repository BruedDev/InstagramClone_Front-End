// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import messengerReducer from "./messengerSlice";
import followUnfollowReducer from "./followUnfollow";
import commentReducer from "./comment";

export const store = configureStore({
  reducer: {
    messenger: messengerReducer,
    followUnfollow: followUnfollowReducer,
    comments: commentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
