// // store/post.ts
// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { likePost as likePostAPI } from '@/server/posts';

// // Định nghĩa types
// interface Post {
//   _id: string;
//   userId: string;
//   content?: string;
//   imageUrl?: string;
//   videoUrl?: string;
//   likes: string[]; // Array của user IDs đã like
//   totalLikes: number;
//   totalComments: number;
//   createdAt: string;
//   updatedAt: string;
//   author: {
//     _id: string;
//     username: string;
//     avatar?: string;
//     checkMark?: boolean;
//   };
//   // Thêm các field khác nếu cần
// }

// interface PostState {
//   posts: Post[];
//   loading: boolean;
//   error: string | null;
//   likeLoading: { [postId: string]: boolean }; // Track loading cho từng post
// }

// const initialState: PostState = {
//   posts: [],
//   loading: false,
//   error: null,
//   likeLoading: {},
// };

// // Async thunk cho like post
// export const likePost = createAsyncThunk(
//   'posts/likePost',
//   async ({ postId, currentUserId }: { postId: string; currentUserId: string }, { rejectWithValue }) => {
//     try {
//       const response = await likePostAPI(postId);
//       return {
//         postId,
//         currentUserId,
//         ...response
//       };
//     } catch (error: unknown) {
//       let errorMessage = 'Failed to like post';
//       if (error instanceof Error) {
//         errorMessage = error.message;
//       }
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// // Create slice
// const postSlice = createSlice({
//   name: 'posts',
//   initialState,
//   reducers: {
//     setPosts: (state, action: PayloadAction<Post[]>) => {
//       state.posts = action.payload;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//     // Optimistic update cho like (để UI phản hồi nhanh)
//     toggleLikeOptimistic: (state, action: PayloadAction<{ postId: string; userId: string }>) => {
//       const { postId, userId } = action.payload;
//       const postIndex = state.posts.findIndex(post => post._id === postId);

//       if (postIndex !== -1) {
//         const post = state.posts[postIndex];
//         const isCurrentlyLiked = post.likes?.includes(userId) || false;

//         if (isCurrentlyLiked) {
//           // Unlike
//           post.likes = post.likes?.filter(id => id !== userId) || [];
//           post.totalLikes = Math.max(0, post.totalLikes - 1);
//         } else {
//           // Like
//           post.likes = [...(post.likes || []), userId];
//           post.totalLikes = post.totalLikes + 1;
//         }
//       }
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Like post cases
//       .addCase(likePost.pending, (state, action) => {
//         const postId = action.meta.arg.postId;
//         state.likeLoading[postId] = true;
//         state.error = null;
//       })
//       .addCase(likePost.fulfilled, (state, action) => {
//         const { postId } = action.payload;
//         state.likeLoading[postId] = false;

//         // Server response sẽ override optimistic update nếu cần
//         const postIndex = state.posts.findIndex(post => post._id === postId);
//         if (postIndex !== -1 && action.payload.totalLikes !== undefined) {
//           state.posts[postIndex].totalLikes = action.payload.totalLikes;
//           if (action.payload.likes) {
//             state.posts[postIndex].likes = action.payload.likes;
//           }
//         }
//       })
//       .addCase(likePost.rejected, (state, action) => {
//         const postId = action.meta.arg.postId;
//         state.likeLoading[postId] = false;
//         state.error = action.payload as string;

//         // Revert optimistic update
//         const { currentUserId } = action.meta.arg;
//         const postIndex = state.posts.findIndex(post => post._id === postId);

//         if (postIndex !== -1) {
//           const post = state.posts[postIndex];
//           const wasLiked = post.likes?.includes(currentUserId) || false;

//           if (wasLiked) {
//             // Revert like
//             post.likes = post.likes?.filter(id => id !== currentUserId) || [];
//             post.totalLikes = Math.max(0, post.totalLikes - 1);
//           } else {
//             // Revert unlike
//             post.likes = [...(post.likes || []), currentUserId];
//             post.totalLikes = post.totalLikes + 1;
//           }
//         }
//       });
//   },
// });

// export const { setPosts, clearError, toggleLikeOptimistic } = postSlice.actions;
// export default postSlice.reducer;

// // Selectors
// export const selectPosts = (state: { posts: PostState }) => state.posts.posts;
// export const selectPostsLoading = (state: { posts: PostState }) => state.posts.loading;
// export const selectPostsError = (state: { posts: PostState }) => state.posts.error;
// export const selectLikeLoading = (state: { posts: PostState }, postId: string) =>
//   state.posts.likeLoading[postId] || false;
// export const selectPostById = (state: { posts: PostState }, postId: string) =>
//   state.posts.posts.find(post => post._id === postId);
// export const selectIsLiked = (state: { posts: PostState }, postId: string, userId: string) => {
//   const post = state.posts.posts.find(p => p._id === postId);
//   return post?.likes?.includes(userId) || false;
// };