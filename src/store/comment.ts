// store/comment.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getCommentsForItem, CommentableItemType } from '@/server/posts';
import { socketService } from '@/server/socket';

export interface Comment {
  _id: string;
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
    fullname?: string;
    isVerified?: boolean;
  };
  text: string;
  post?: string;
  reels?: string;
  parentId?: string;
  createdAt: string;
  updatedAt?: string;
  likes?: string[];
  replies: Comment[];
  likeCount?: number;
  isReply?: boolean;
  isOwnComment?: boolean;
  reactions?: {
    [key: string]: {
      users: string[];
      count: number;
    };
  };
}

export interface CommentMetrics {
  totalComments: number;
  totalReplies: number;
  totalLikes: number;
  buffedComments?: number;
  buffedReplies?: number;
  total?: number;
  hasMore: boolean;
}

export interface CommentState {
  commentsByItem: Record<string, Comment[]>;
  loading: Record<string, boolean>;
  loadingMore: Record<string, boolean>;
  error: Record<string, string | null>;
  metrics: Record<string, CommentMetrics>;
  typingUsers: Record<string, Array<{
    id: string;
    username: string;
    profilePicture?: string;
  }>>;
  activeItem: {
    id: string;
    type: CommentableItemType;
  } | null;
}

const initialState: CommentState = {
  commentsByItem: {},
  loading: {},
  loadingMore: {},
  error: {},
  metrics: {},
  typingUsers: {},
  activeItem: null,
};

// === COMMENT LOGIC: ONLY USE API FOR INITIAL LOAD ===
// After initial load, use socket for all comment actions (add, edit, delete, reply, like, etc.)
// Do NOT call addCommentToPost except for SSR or first load.

// Thunk chỉ dùng để fetch comment lần đầu hoặc reload
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async ({
    itemId,
    itemType,
    limit = 15
  }: {
    itemId: string;
    itemType: CommentableItemType;
    limit?: number;
  }) => {
    const response = await getCommentsForItem(itemId, itemType, limit);
    return { itemId, response };
  }
);

// Thêm comment: chỉ emit socket, không gọi API
export const addComment = createAsyncThunk(
  'comments/addComment',
  async ({
    itemId,
    itemType,
    text,
    parentId
  }: {
    itemId: string;
    itemType: CommentableItemType;
    text: string;
    parentId?: string;
  }, { getState }) => {
    const state = getState() as { auth?: { user?: { _id?: string } } };
    let userId = state.auth?.user?._id;
    if (!userId) {
      userId = typeof window !== 'undefined' ? (localStorage.getItem('id') ?? undefined) : undefined;
    }
    if (!userId) throw new Error('User not authenticated');
    // Map itemType về 'post' hoặc 'reel' cho socket
    let socketItemType: 'post' | 'reel' = 'post';
    if (itemType === 'reel') socketItemType = 'reel';
    // Emit qua socket
    const payload: {
      authorId: string;
      itemId: string;
      itemType: 'post' | 'reel';
      text: string;
      parentId?: string;
    } = {
      authorId: userId,
      itemId,
      itemType: socketItemType,
      text,
    };
    if (parentId) payload.parentId = parentId;
    socketService.emitCommentCreate(payload);
    // Không trả về gì, BE sẽ emit lại danh sách comment mới
    return { itemId };
  }
);

export const startTyping = createAsyncThunk(
  'comments/startTyping',
  async ({
    itemId,
    itemType,
    user
  }: {
    itemId: string;
    itemType: 'post' | 'reel';
    user: { id: string; username: string; profilePicture?: string };
  }) => {
    socketService.emitCommentTyping({ itemId, itemType, user });
    return { itemId, user };
  }
);

export const stopTyping = createAsyncThunk(
  'comments/stopTyping',
  async ({
    itemId,
    itemType,
    userId
  }: {
    itemId: string;
    itemType: 'post' | 'reel';
    userId: string;
  }) => {
    socketService.emitCommentStopTyping({ itemId, itemType, userId });
    return { itemId, userId };
  }
);

export const reactToComment = createAsyncThunk(
  'comments/reactToComment',
  async ({
    commentId,
    reaction,
    user
  }: {
    commentId: string;
    reaction: string;
    user: { id: string; username: string; profilePicture?: string };
  }) => {
    socketService.emitCommentReact({ commentId, reaction, user });
    return { commentId, reaction, user };
  }
);

// Thunk để load thêm comments khi scroll (không ảnh hưởng realtime)
export const loadMoreComments = createAsyncThunk(
  'comments/loadMoreComments',
  async ({
    itemId,
    itemType,
    limit = 15
  }: {
    itemId: string;
    itemType: CommentableItemType;
    limit?: number;
  }, { getState }) => {
    const state = getState() as { comments: CommentState };
    const currentComments = state.comments.commentsByItem[itemId] || [];
    const skip = currentComments.length;
    // Giả định API hỗ trợ skip/offset (nếu không, cần backend hỗ trợ)
    const response = await getCommentsForItem(itemId, itemType, limit, skip);
    return { itemId, response };
  }
);

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    setActiveItem: (state, action: PayloadAction<{ id: string; type: CommentableItemType }>) => {
      const { id, type } = action.payload;
      if (state.activeItem) {
        if (state.activeItem.type === 'post' || state.activeItem.type === 'image') {
          socketService.leavePostRoom(state.activeItem.id);
        } else if (state.activeItem.type === 'reel') {
          socketService.leaveReelRoom(state.activeItem.id);
        }
      }
      // Luôn join room post_<id> cho cả post và image (FE và BE phải đồng bộ room)
      socketService.joinPostRoom(id);
      // Bổ sung: emit lấy lại comment realtime khi setActiveItem
      const socketItemType: 'post' | 'reel' = type === 'reel' ? 'reel' : 'post';
      socketService.emitCommentsGet({ itemId: id, itemType: socketItemType });
      state.activeItem = { id, type };
    },
    clearActiveItem: (state) => {
      if (state.activeItem) {
        if (state.activeItem.type === 'post' || state.activeItem.type === 'image') {
          socketService.leavePostRoom(state.activeItem.id);
        } else if (state.activeItem.type === 'reel') {
          socketService.leaveReelRoom(state.activeItem.id);
        }
      }
      state.activeItem = null;
    },        handleSocketCommentCreated: (state, action: PayloadAction<{
      itemId: string;
      itemType: 'post' | 'reel';
      comment: Comment;
    }>) => {
      const { itemId, comment: newComment } = action.payload;
      if (!state.commentsByItem[itemId]) {
        state.commentsByItem[itemId] = [];
      }

      if (newComment.parentId) {
        // It's a reply - find parent and add to its replies
        const findAndAddReply = (comments: Comment[]) => {
          for (const comment of comments) {
            if (comment._id === newComment.parentId) {
              if (!comment.replies) comment.replies = [];
              // Check if reply already exists to avoid duplicates
              if (!comment.replies.find(r => r._id === newComment._id)) {
                comment.replies.push({
                  ...newComment,
                  isReply: true,
                  replies: [] // Initialize empty replies array for nested structure
                });
                // Sort replies by newest first
                comment.replies.sort((a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
              }
              return true;
            }
            // Check in nested replies
            if (comment.replies?.length > 0 && findAndAddReply(comment.replies)) {
              return true;
            }
          }
          return false;
        };

        findAndAddReply(state.commentsByItem[itemId]);
      } else {
        // It's a new top-level comment
        if (!state.commentsByItem[itemId].find(c => c._id === newComment._id)) {
          state.commentsByItem[itemId].unshift({
            ...newComment,
            replies: [], // Initialize empty replies array
            isReply: false
          });
        }
      }

      // Update metrics
      if (state.metrics[itemId]) {
        if (newComment.parentId) {
          state.metrics[itemId].totalReplies = (state.metrics[itemId].totalReplies || 0) + 1;
        } else {
          state.metrics[itemId].totalComments = (state.metrics[itemId].totalComments || 0) + 1;
        }
        state.metrics[itemId].total = (state.metrics[itemId].totalComments || 0) + (state.metrics[itemId].totalReplies || 0);
      }
    },
    handleSocketCommentEdited: (state, action: PayloadAction<{
      commentId: string;
      newText: string;
      itemId: string;
    }>) => {
      const { commentId, newText, itemId } = action.payload;
      if (state.commentsByItem[itemId]) {
        const updateComment = (comments: Comment[]) => {
          for (const comment of comments) {
            if (comment._id === commentId) {
              comment.text = newText;
              comment.updatedAt = new Date().toISOString();
              return true;
            }
            if (comment.replies.length > 0 && updateComment(comment.replies)) {
              return true;
            }
          }
          return false;
        };
        updateComment(state.commentsByItem[itemId]);
      }
    },
    handleSocketCommentDeleted: (state, action: PayloadAction<{
      commentId: string;
      itemId: string;
    }>) => {
      const { commentId, itemId } = action.payload;
      if (state.commentsByItem[itemId]) {
        const removeComment = (comments: Comment[]): boolean => {
          for (let i = 0; i < comments.length; i++) {
            if (comments[i]._id === commentId) {
              comments.splice(i, 1);
              return true;
            }
            if (comments[i].replies.length > 0 && removeComment(comments[i].replies)) {
              return true;
            }
          }
          return false;
        };
        removeComment(state.commentsByItem[itemId]);
      }
    },
    handleSocketTyping: (state, action: PayloadAction<{
      itemId: string;
      user: { id: string; username: string; profilePicture?: string };
    }>) => {
      const { itemId, user } = action.payload;
      if (!state.typingUsers[itemId]) {
        state.typingUsers[itemId] = [];
      }
      if (!state.typingUsers[itemId].find(u => u.id === user.id)) {
        state.typingUsers[itemId].push(user);
      }
    },
    handleSocketStopTyping: (state, action: PayloadAction<{
      itemId: string;
      userId: string;
    }>) => {
      const { itemId, userId } = action.payload;
      if (state.typingUsers[itemId]) {
        state.typingUsers[itemId] = state.typingUsers[itemId].filter(
          user => user.id !== userId
        );
      }
    },
    handleSocketCommentReacted: (state, action: PayloadAction<{
      commentId: string;
      reaction: string;
      user: { id: string; username: string; profilePicture?: string };
    }>) => {
      const { commentId, reaction, user } = action.payload;
      Object.values(state.commentsByItem).forEach(comments => {
        const updateReaction = (currentComments: Comment[]): boolean => {
          for (const comment of currentComments) {
            if (comment._id === commentId) {
              if (!comment.reactions) {
                comment.reactions = {};
              }
              if (!comment.reactions[reaction]) {
                comment.reactions[reaction] = { users: [], count: 0 };
              }
              const userIndex = comment.reactions[reaction].users.indexOf(user.id);
              if (userIndex === -1) {
                comment.reactions[reaction].users.push(user.id);
                comment.reactions[reaction].count++;
              } else {
                comment.reactions[reaction].users.splice(userIndex, 1);
                comment.reactions[reaction].count--;
              }
              return true;
            }
            if (comment.replies.length > 0 && updateReaction(comment.replies)) {
              return true;
            }
          }
          return false;
        };
        updateReaction(comments);
      });
    },
    handleSocketCommentsUpdated: (state, action: PayloadAction<{
      comments: Comment[];
      metrics: CommentMetrics;
      itemId: string;
      itemType: string;
    }>) => {
      const { itemId, comments, metrics } = action.payload;
      // Gán trực tiếp cây comments từ backend (đã nested)
      state.commentsByItem[itemId] = comments;
      state.metrics[itemId] = {
        ...metrics,
        total: (metrics.totalComments || 0) + (metrics.totalReplies || 0)
      };
    },
    clearCommentsForItem: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      delete state.commentsByItem[itemId];
      delete state.loading[itemId];
      delete state.loadingMore[itemId];
      delete state.error[itemId];
      delete state.metrics[itemId];
      delete state.typingUsers[itemId];
    },
    clearAllComments: (state) => {
      state.commentsByItem = {};
      state.loading = {};
      state.loadingMore = {};
      state.error = {};
      state.metrics = {};
      state.typingUsers = {};
      state.activeItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments (initial load)
      .addCase(fetchComments.pending, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loading[itemId] = true;
        state.error[itemId] = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { itemId, response } = action.payload;
        state.loading[itemId] = false;
        state.commentsByItem[itemId] = sortComments(response.comments);
        state.metrics[itemId] = response.metrics;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loading[itemId] = false;
        state.error[itemId] = action.error.message || 'Failed to fetch comments';
      })
      .addCase(addComment.pending, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loading[`add_${itemId}`] = true;
        state.error[`add_${itemId}`] = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loading[`add_${itemId}`] = false;
        state.error[`add_${itemId}`] = null;
        // Không cần optimistic update, BE sẽ emit lại danh sách comment mới nhất qua socket
      })
      .addCase(addComment.rejected, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loading[`add_${itemId}`] = false;
        state.error[`add_${itemId}`] = action.error.message || 'Failed to add comment';
      })
      // Load more comments
      .addCase(loadMoreComments.pending, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loadingMore[itemId] = true;
        state.error[itemId] = null;
      })
      .addCase(loadMoreComments.fulfilled, (state, action) => {
        const { itemId, response } = action.payload;
        state.loadingMore[itemId] = false;
        // Merge comments, tránh trùng lặp
        const existing = state.commentsByItem[itemId] || [];
        const newComments = response.comments.filter((c: Comment) => !existing.some(e => e._id === c._id));
        state.commentsByItem[itemId] = [...existing, ...sortComments(newComments)];
        state.metrics[itemId] = response.metrics;
      })
      .addCase(loadMoreComments.rejected, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loadingMore[itemId] = false;
        state.error[itemId] = action.error.message || 'Failed to load more comments';
      });
  },
});

export const {
  setActiveItem,
  clearActiveItem,
  clearCommentsForItem,
  clearAllComments,
  handleSocketCommentCreated,
  handleSocketCommentEdited,
  handleSocketCommentDeleted,
  handleSocketTyping,
  handleSocketStopTyping,
  handleSocketCommentReacted,
  handleSocketCommentsUpdated,
} = commentSlice.actions;

export default commentSlice.reducer;

// sortComments
function sortComments(comments: Comment[]): Comment[] {
  return comments
    .slice()
    .sort((a, b) => {
      // Sắp xếp theo thời gian tạo (mới nhất trước)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}