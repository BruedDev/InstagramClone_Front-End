// store/comment.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { addCommentToPost, getCommentsForItem, CommentableItemType } from '@/server/posts';
import { socketService } from '@/server/socket';

export interface Comment {
  _id: string;
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
    fullname?: string;
  };
  text: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  replies: Comment[];
  reactions?: {
    [key: string]: {
      users: string[];
      count: number;
    };
  };
  likes?: number;
}

export interface CommentMetrics {
  totalComments: number;
  totalLikes: number;
  buffedComments?: number;
  buffedReplies?: number;
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
  }) => {
    const response = await getCommentsForItem(itemId, itemType, limit);
    return { itemId, response };
  }
);

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
  }) => {
    if (itemType === 'post' || itemType === 'image') {
      const response = await addCommentToPost(itemId, text, itemType, parentId);
      return { itemId, comment: response.comment };
    }
    throw new Error('Unsupported item type for adding comment');
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
      if (type === 'post' || type === 'image') {
        socketService.joinPostRoom(id);
      } else if (type === 'reel') {
        socketService.joinReelRoom(id);
      }
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
    },
    handleSocketCommentCreated: (state, action: PayloadAction<{
      itemId: string;
      itemType: 'post' | 'reel';
      comment: Comment;
    }>) => {
      const { itemId, comment: newComment } = action.payload;
      if (!state.commentsByItem[itemId]) {
        state.commentsByItem[itemId] = [];
      }
      const addCommentIfNotExists = (comments: Comment[], commentToAdd: Comment): boolean => {
        if (commentToAdd.parentId) {
          for (const c of comments) {
            if (c._id === commentToAdd.parentId) {
              if (!c.replies) c.replies = [];
              if (!c.replies.find(reply => reply._id === commentToAdd._id)) {
                c.replies.push(commentToAdd);
              }
              return true;
            }
            if (c.replies && c.replies.length > 0 && addCommentIfNotExists(c.replies, commentToAdd)) {
              return true;
            }
          }
          return false;
        } else {
          if (!comments.find(c => c._id === commentToAdd._id)) {
            comments.push(commentToAdd);
          }
          return true;
        }
      };
      addCommentIfNotExists(state.commentsByItem[itemId], newComment);
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
      state.commentsByItem[itemId] = sortComments(comments);
      state.metrics[itemId] = metrics;
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

      // Load more comments
      .addCase(loadMoreComments.pending, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loadingMore[itemId] = true;
        state.error[itemId] = null;
      })
      .addCase(loadMoreComments.fulfilled, (state, action) => {
        const { itemId, response } = action.payload;
        state.loadingMore[itemId] = false;

        // Append new comments to existing ones, rồi sort lại
        if (state.commentsByItem[itemId]) {
          state.commentsByItem[itemId] = sortComments([
            ...state.commentsByItem[itemId],
            ...response.comments
          ]);
        } else {
          state.commentsByItem[itemId] = sortComments(response.comments);
        }

        state.metrics[itemId] = response.metrics;
      })
      .addCase(loadMoreComments.rejected, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loadingMore[itemId] = false;
        state.error[itemId] = action.error.message || 'Failed to load more comments';
      });

    builder
      .addCase(addComment.pending, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loading[`add_${itemId}`] = true;
        state.error[`add_${itemId}`] = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const { itemId, comment: newComment } = action.payload;
        state.loading[`add_${itemId}`] = false;
        state.error[`add_${itemId}`] = null;
        if (!state.commentsByItem[itemId]) {
          state.commentsByItem[itemId] = [];
        }
        const addOptimisticComment = (comments: Comment[], commentToAdd: Comment): boolean => {
          if (commentToAdd.parentId) {
            for (const c of comments) {
              if (c._id === commentToAdd.parentId) {
                if (!c.replies) c.replies = [];
                if (!c.replies.find(reply => reply._id === commentToAdd._id)) {
                  c.replies.push(commentToAdd);
                }
                return true;
              }
              if (c.replies && c.replies.length > 0 && addOptimisticComment(c.replies, commentToAdd)) {
                return true;
              }
            }
            return false;
          } else {
            if (!comments.find(c => c._id === commentToAdd._id)) {
              comments.push(commentToAdd);
            }
            return true;
          }
        };
        addOptimisticComment(state.commentsByItem[itemId], newComment);
      })
      .addCase(addComment.rejected, (state, action) => {
        const itemId = action.meta.arg.itemId;
        state.loading[`add_${itemId}`] = false;
        state.error[`add_${itemId}`] = action.error.message || 'Failed to add comment';
      });
  },
});

export const {
  setActiveItem,
  clearActiveItem,
  handleSocketCommentCreated,
  handleSocketCommentEdited,
  handleSocketCommentDeleted,
  handleSocketTyping,
  handleSocketStopTyping,
  handleSocketCommentReacted,
  handleSocketCommentsUpdated,
  clearCommentsForItem,
  clearAllComments,
} = commentSlice.actions;

export default commentSlice.reducer;

// Hàm sort comment mới nhất lên trên (dùng lại ở nhiều nơi)
const sortByDateDesc = (a: Comment, b: Comment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
const sortComments = (comments: Comment[]): Comment[] => {
  return comments
    .map(comment => ({
      ...comment,
      replies: comment.replies && comment.replies.length > 0 ? sortComments(comment.replies) : []
    }))
    .sort(sortByDateDesc);
};