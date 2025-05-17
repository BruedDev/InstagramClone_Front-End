// @/store/messengerSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getAvailableUsers, getMessages } from "@/server/messenger";
import { Message, User } from "@/types/user.type";
import { MessengerState } from "@/types/messenger.types";
import { createRef } from "react";

const PAGE_SIZE = 6;

// Async Thunks
export const fetchAvailableUsers = createAsyncThunk(
  "messenger/fetchAvailableUsers",
  async () => {
    const response = await getAvailableUsers();
    const users: User[] = Array.isArray(response)
      ? response
      : Array.isArray(response) && Array.isArray(response[0])
      ? (response[0] as User[])
      : [];
    return users;
  }
);

export const fetchMessages = createAsyncThunk(
  "messenger/fetchMessages",
  async ({
    userId,
    offset = 0,
    replace = false,
  }: {
    userId: string;
    offset?: number;
    replace?: boolean;
  }) => {
    const messages = await getMessages(userId, PAGE_SIZE, offset);
    return { messages, offset, replace };
  }
);

const initialState: MessengerState = {
  availableUsers: [],
  selectedUser: null,
  messages: [],
  message: "",
  loading: false,
  loadingMore: false,
  hasMore: true,
  offset: 0,
  showMainChat: false,
  ringtoneRef: createRef<HTMLAudioElement>(),
  // Call states
  inCall: false,
  incoming: null,
  callHistory: [], // Thêm trường mới để lưu lịch sử cuộc gọi nếu cần
};

const messengerSlice = createSlice({
  name: "messenger",
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
      state.messages = [];
      state.offset = 0;
      state.hasMore = true;
      state.showMainChat = !!action.payload;
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setShowMainChat: (state, action: PayloadAction<boolean>) => {
      state.showMainChat = action.payload;
    },
    // Call actions
    setInCall: (state, action: PayloadAction<boolean>) => {
      state.inCall = action.payload;
    },
    setIncoming: (
      state,
      action: PayloadAction<{
        callerId: string;
        callType: "audio" | "video";
      } | null>
    ) => {
      state.incoming = action.payload;
    },
    // Thêm action để lưu lịch sử cuộc gọi nếu cần
    addCallHistory: (
      state,
      action: PayloadAction<{
        userId: string;
        callType: "audio" | "video";
        timestamp: number;
        duration?: number;
        status: "missed" | "answered" | "outgoing";
      }>
    ) => {
      state.callHistory.push(action.payload);
    },
    resetMessagesState: (state) => {
      state.messages = [];
      state.offset = 0;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableUsers.fulfilled, (state, action) => {
        state.availableUsers = action.payload;
      })
      .addCase(fetchAvailableUsers.rejected, (state) => {
        state.availableUsers = [];
      })
      // Xử lý fetchMessages
      .addCase(fetchMessages.pending, (state, action) => {
        const { replace } = action.meta.arg as { replace?: boolean };
        if (replace) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { messages, offset, replace } = action.payload;

        if (replace) {
          state.messages = messages;
        } else {
          state.messages = [...messages, ...state.messages];
        }

        state.offset = offset + messages.length;
        state.hasMore = messages.length === PAGE_SIZE;
        state.loading = false;
        state.loadingMore = false;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const { replace } = action.meta.arg as { replace?: boolean };

        if (replace) {
          state.messages = [];
          state.loading = false;
        } else {
          state.loadingMore = false;
        }
      });
  },
});

export const {
  setSelectedUser,
  setMessage,
  addMessage,
  setShowMainChat,
  setInCall,
  setIncoming,
  addCallHistory,
  resetMessagesState,
} = messengerSlice.actions;

export default messengerSlice.reducer;