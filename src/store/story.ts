// @/store/story.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getStoryHome } from "@/server/home";
import { getStoriesByUser } from "@/server/story";
import { initialState, Story, GroupedStory } from "@/types/story.type";

// Thunk async để lấy stories từ API
export const fetchStoryHome = createAsyncThunk(
  "story/fetchStoryHome",
  async (_, { rejectWithValue }) => {
    try {
      const stories: Story[] = await getStoryHome();
      // Group stories by author._id
      const grouped: Record<string, Story[]> = {};
      stories.forEach((story) => {
        const authorId = story.author._id;
        if (!grouped[authorId]) {
          grouped[authorId] = [];
        }
        grouped[authorId].push(story);
      });
      // Convert to array: each item is { author, stories: [...] }
      const result: GroupedStory[] = Object.values(grouped).map((storyArr) => ({
        author: storyArr[0].author,
        stories: storyArr,
      }));
      return result;
    } catch (error: unknown) {
      let errorMessage = "Đã xảy ra lỗi";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Thunk async để lấy stories của 1 user (dùng cho xem story cá nhân)
export const getStoryById = createAsyncThunk(
  "story/getStoryById",
  async (userIdOrUsername: string, { rejectWithValue }) => {
    try {
      const stories: Story[] = await getStoriesByUser(userIdOrUsername);
      return stories;
    } catch (error: unknown) {
      let errorMessage = "Đã xảy ra lỗi";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Tạo slice
export const storySlice = createSlice({
  name: "story",
  initialState: {
    ...initialState,
    currentUserStories: [] as Story[], // stories của user đang xem
    isPlaying: true,
    isMuted: false,
  },
  reducers: {
    // Action để reset lại state nếu cần
    clearStories: (state) => {
      state.stories = [];
      state.error = null;
      state.loading = false;
      state.currentUserStories = [];
      state.isPlaying = true;
      state.isMuted = false;
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    setIsMuted: (state, action) => {
      state.isMuted = action.payload;
    },
    setCurrentUserStories: (state, action) => {
      state.currentUserStories = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoryHome.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoryHome.fulfilled, (state, action) => {
        state.loading = false;
        state.stories = action.payload;
      })
      .addCase(fetchStoryHome.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getStoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentUserStories = [];
      })
      .addCase(getStoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUserStories = action.payload;
      })
      .addCase(getStoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentUserStories = [];
      });
  },
});

// Export reducer và actions
export const { clearStories, setIsPlaying, setIsMuted, setCurrentUserStories } = storySlice.actions;

export default storySlice.reducer;
