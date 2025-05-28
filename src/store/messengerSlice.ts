// @/store/messengerSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getAvailableUsers, getMessagesWithPagination, getUserStatus } from "@/server/messenger";
import { Message, User } from "@/types/user.type";
import { MessengerState } from "@/types/messenger.types";
import { createRef } from "react";

const PAGE_SIZE = 20; // Đổi về 20 cho đồng bộ API mới

// Define the type for the API response
interface AvailableUser {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark?: boolean;
  lastActive?: string | number | null;
  lastOnline?: string | number | null;
  isOnline?: boolean;
}

// Async Thunks
export const fetchAvailableUsers = createAsyncThunk(
  "messenger/fetchAvailableUsers",
  async () => {
    const response = await getAvailableUsers();
    const users: User[] = Array.isArray(response)
      ? response.map((user: AvailableUser & { hasStory?: boolean }) => ({
          id: user._id,
          _id: user._id,
          username: user.username,
          fullName: user.username, // Using username as fullName if not provided
          email: "", // Default empty string
          phoneNumber: 0, // Default number
          profilePicture: user.profilePicture || "",
          bio: "", // Default empty string
          followers: [], // Default empty array
          following: [], // Default empty array
          isPrivate: false, // Default false
          authType: "local", // Default local
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          checkMark: user.checkMark || false,
          lastActive: user.lastActive || null,
          lastOnline: user.lastOnline || null,
          isFollowing: false,
          followersCount: 0,
          followingCount: 0,
          hasStory: user.hasStory || false, // Add hasStory from backend
        }))
      : [];
    return users;
  }
);

// Fetch messages dùng API mới (infinite scroll)
export const fetchMessages = createAsyncThunk(
  "messenger/fetchMessages",
  async ({
    userId,
    before,
    replace = false,
  }: {
    userId: string;
    before?: string;
    replace?: boolean;
  }) => {
    const res = await getMessagesWithPagination(userId, before, PAGE_SIZE);
    return { ...res, before, replace };
  }
);

export const checkOnline = createAsyncThunk(
 "messenger/checkOnline",
 async (identifier: string) => {
   const response = await getUserStatus(identifier);
   return response;
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
 before: undefined, // Thay offset bằng before (timestamp)
 showMainChat: false,
 ringtoneRef: createRef<HTMLAudioElement>(),
 // Call states
 inCall: false,
 incoming: null,
 callHistory: [], // Thêm trường mới để lưu lịch sử cuộc gọi nếu cần
 // Online status
 userStatus: null,
 checkingStatus: false,
 // Add missing MessengerState properties
 timestamp: 0,
 status: "missed",
 // Thêm biến này để lưu userId đã fetch gần nhất
 lastFetchedUserId: undefined,
};

const messengerSlice = createSlice({
 name: "messenger",
 initialState,
 reducers: {
   setSelectedUser: (state, action: PayloadAction<User | null>) => {
     state.selectedUser = action.payload;
     // KHÔNG xóa messages ở đây nữa để tránh nhấp nháy
     state.before = undefined;
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
     state.before = undefined;
     state.hasMore = true;
   },
   resetUserStatus: (state) => {
     state.userStatus = null;
     state.checkingStatus = false;
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
     // Xử lý fetchMessages với API mới
     .addCase(fetchMessages.pending, (state, action) => {
       const { replace } = action.meta.arg as { replace?: boolean };
       if (replace) {
         state.loading = true;
       } else {
         state.loadingMore = true;
       }
     })
     .addCase(fetchMessages.fulfilled, (state, action) => {
       const { messages, hasMore, oldestTimestamp, replace } = action.payload;
       if (replace) {
         state.messages = messages;
       } else {
         state.messages = [...messages, ...state.messages];
       }
       state.before = oldestTimestamp === null ? undefined : oldestTimestamp;
       state.hasMore = hasMore;
       state.loading = false;
       state.loadingMore = false;
       // Lấy userId từ selectedUser để cập nhật lastFetchedUserId
       if (state.selectedUser) {
         state.lastFetchedUserId = state.selectedUser._id;
       }
     })
     .addCase(fetchMessages.rejected, (state, action) => {
       const { replace } = action.meta.arg as { replace?: boolean };
       if (replace) {
         state.messages = [];
         state.loading = false;
       } else {
         state.loadingMore = false;
       }
     })
     // Xử lý checkOnline
     .addCase(checkOnline.pending, (state) => {
       state.checkingStatus = true;
     })
     .addCase(checkOnline.fulfilled, (state, action) => {
       state.userStatus = action.payload;
       state.checkingStatus = false;
     })
     .addCase(checkOnline.rejected, (state) => {
       state.userStatus = null;
       state.checkingStatus = false;
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
 resetUserStatus,
} = messengerSlice.actions;

export default messengerSlice.reducer;