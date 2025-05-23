import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// ⚙️ Action: Điều chỉnh đường dẫn đến các hàm API của bạn.
import { followUserApi } from '@/server/user';
import { ToggleFollowResponse } from '@/server/user'; // Hoặc từ file types của bạn

export type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UserActionState {
  status: ActionStatus;
  error?: string | null;
  lastPerformedAction?: 'followed' | 'unfollowed' | null;
  isFollowing: boolean;
}

export interface FollowUnfollowSliceState {
  userActionStates: Record<string, UserActionState>;
  followersCountMap: Record<string, number>;
  followingCountMap: Record<string, number>;
  currentLoggedInUserId: string | null;
}

const initialState: FollowUnfollowSliceState = {
  userActionStates: {},
  followersCountMap: {},
  followingCountMap: {},
  currentLoggedInUserId: null,
};

export const toggleFollowState = createAsyncThunk<
  { userId: string; action: 'followed' | 'unfollowed'; message: string },
  string, // targetUserId
  { rejectValue: { userId: string; message: string } }
>(
  'followUnfollow/toggleFollowState',
  async (targetUserId: string, { rejectWithValue }) => {
    try {
      const response: ToggleFollowResponse = await followUserApi(targetUserId);
      return { userId: targetUserId, action: response.action, message: response.message };
    } catch (error: unknown) {
      let errorMessage = 'Đã có lỗi xảy ra khi thay đổi trạng thái theo dõi.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return rejectWithValue({ userId: targetUserId, message: errorMessage });
    }
  }
);

const followUnfollowSlice = createSlice({
  name: 'followUnfollow',
  initialState,
  reducers: {
    resetUserActionState: (state, action: PayloadAction<string>) => {
      const targetUserId = action.payload;
      if (state.userActionStates[targetUserId]) {
        // Reset cả lastPerformedAction
        state.userActionStates[targetUserId] = { status: 'idle', error: null, lastPerformedAction: null, isFollowing: state.userActionStates[targetUserId].isFollowing ?? false };
      }
    },
    setUserActionState: (state, action: PayloadAction<{ userId: string; userState: UserActionState }>) => {
      const { userId, userState } = action.payload;
      // Đảm bảo cấu trúc UserActionState được tuân thủ
      state.userActionStates[userId] = {
        status: userState.status,
        error: userState.error,
        lastPerformedAction: userState.lastPerformedAction !== undefined ? userState.lastPerformedAction : null,
        isFollowing: userState.isFollowing,
      };
    },
    setCurrentLoggedInUserId: (state, action: PayloadAction<string | null>) => {
      state.currentLoggedInUserId = action.payload;
    },
    setUserProfileCounts: (state, action: PayloadAction<{ userId: string; followers: number; following: number }>) => {
      const { userId, followers, following } = action.payload;
      state.followersCountMap[userId] = followers;
      state.followingCountMap[userId] = following;
    },
    /**
     * Action mới (tùy chọn) để khởi tạo trạng thái theo dõi ban đầu cho một user cụ thể
     * Component Action.tsx có thể dispatch action này khi mount dựa trên prop user.isFollowing.
     */
    initializeFollowStatusForUser: (state, action: PayloadAction<{ userId: string; isFollowing: boolean }>) => {
        const { userId, isFollowing } = action.payload;
        if (!state.userActionStates[userId]) {
            state.userActionStates[userId] = { status: 'idle', error: null, lastPerformedAction: null, isFollowing: isFollowing };
        }
        // Chỉ đặt nếu chưa có hành động nào được thực hiện trước đó hoặc đang ở trạng thái idle
        // Điều này giúp tránh ghi đè lên một hành động đang diễn ra hoặc một lỗi.
        // Hoặc, bạn có thể luôn đặt nó, tùy thuộc vào logic mong muốn.
        // Hiện tại, sẽ đặt lastPerformedAction dựa trên isFollowing.
        state.userActionStates[userId].lastPerformedAction = isFollowing ? 'followed' : 'unfollowed';
        state.userActionStates[userId].status = 'idle'; // Đảm bảo status là idle sau khi khởi tạo
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(toggleFollowState.pending, (state, action) => {
        const targetUserId = action.meta.arg;
        const existingState = state.userActionStates[targetUserId];
        state.userActionStates[targetUserId] = {
          status: 'loading',
          error: null,
          lastPerformedAction: existingState?.lastPerformedAction, // Giữ lại lastPerformedAction trước đó
          isFollowing: existingState?.isFollowing ?? false // Giữ lại trạng thái isFollowing trước đó, mặc định là false nếu chưa có
        };
      })
      .addCase(toggleFollowState.fulfilled, (state, action) => {
        const { userId: targetUserId, action: performedAction } = action.payload;
        state.userActionStates[targetUserId] = {
          status: 'success',
          error: null,
          lastPerformedAction: performedAction, // <-- LƯU HÀNH ĐỘNG ĐÃ THỰC HIỆN
          isFollowing: performedAction === 'followed'
        };

        // Cập nhật số lượng (logic này giữ nguyên như trước)
        const loggedInUserId = state.currentLoggedInUserId;
        if (typeof state.followersCountMap[targetUserId] === 'number') {
          if (performedAction === 'followed') {
            state.followersCountMap[targetUserId]++;
          } else if (performedAction === 'unfollowed') {
            state.followersCountMap[targetUserId] = Math.max(0, state.followersCountMap[targetUserId] - 1);
          }
        } else {
           if (performedAction === 'followed') {
             state.followersCountMap[targetUserId] = 1;
           }
        }
        if (loggedInUserId && typeof state.followingCountMap[loggedInUserId] === 'number') {
          if (performedAction === 'followed') {
            state.followingCountMap[loggedInUserId]++;
          } else if (performedAction === 'unfollowed') {
            state.followingCountMap[loggedInUserId] = Math.max(0, state.followingCountMap[loggedInUserId] - 1);
          }
        }
      })
      .addCase(toggleFollowState.rejected, (state, action) => {
        const userIdOnError = action.payload ? action.payload.userId : action.meta.arg;
        const errorMessage = action.payload ? action.payload.message : (action.error.message || 'Lỗi không xác định');
        const existingState = state.userActionStates[userIdOnError];
        state.userActionStates[userIdOnError] = {
          status: 'error',
          error: errorMessage,
          lastPerformedAction: existingState?.lastPerformedAction, // Giữ lại lastPerformedAction trước đó khi có lỗi
          isFollowing: existingState?.isFollowing ?? false // Đảm bảo isFollowing luôn có mặt
        };
      });
  },
});

export const {
  resetUserActionState,
  setUserActionState,
  setCurrentLoggedInUserId,
  setUserProfileCounts,
  initializeFollowStatusForUser,
} = followUnfollowSlice.actions;

export default followUnfollowSlice.reducer;