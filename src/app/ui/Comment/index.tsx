import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  fetchComments,
  loadMoreComments,
  setActiveItem,
  clearActiveItem,
} from "@/store/comment";
import { socketService } from "@/server/socket";
import styles from "@/components/Modal/PostModal.module.scss";
import { Post } from "@/types/home.type";
import { X } from "lucide-react";
import CommentInput from "../CommentInput";
import { CommentWithReplies } from "@/components/CommentWithReplies";
import { ReplyData } from "@/components/CommentItem";

export default function Comment({
  post,
  onReplySelect,
  onClose,
  animationClass = "",
}: {
  post: Post;
  onReplySelect?: (replyData: ReplyData) => void;
  onClose?: () => void;
  animationClass?: string;
}) {
  const dispatch = useDispatch<AppDispatch>();

  // STATE ĐỂ QUẢN LÝ REPLY CHO MOBILE VIEW
  const [replyTo, setReplyTo] = useState<ReplyData | null>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);

  const rawComments = useSelector(
    (state: RootState) => state.comments.commentsByItem[post._id] || []
  );
  const loading = useSelector(
    (state: RootState) => state.comments.loading[post._id] || false
  );
  const loadingMore = useSelector(
    (state: RootState) => state.comments.loadingMore[post._id] || false
  );
  const error = useSelector(
    (state: RootState) => state.comments.error[post._id]
  );
  const metrics = useSelector(
    (state: RootState) => state.comments.metrics[post._id]
  );

  // Deduplicate comments để tránh duplicate keys
  const comments = useMemo(() => {
    const seen = new Set();
    return rawComments.filter((comment) => {
      if (seen.has(comment._id)) {
        console.warn(`Duplicate comment found with id: ${comment._id}`);
        return false;
      }
      seen.add(comment._id);
      return true;
    });
  }, [rawComments]);

  const handleReply = (replyData: ReplyData) => {
    if (onReplySelect) {
      // Desktop view - truyền lên PostModal
      onReplySelect(replyData);
    } else {
      // Mobile view - xử lý local
      setReplyTo(replyData);
    }
  };

  // HÀM ĐỂ HỦY REPLY CHO MOBILE VIEW
  const handleReplyCancel = () => {
    setReplyTo(null);
  };

  // Prevent event bubbling khi click vào comments section
  const handleCommentsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!commentsListRef.current || !metrics?.hasMore || loadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = commentsListRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8) {
      const itemType = post.type === "video" ? "video" : "image";
      dispatch(
        loadMoreComments({
          itemId: post._id,
          itemType,
          limit: 15,
        })
      );
    }
  }, [dispatch, post._id, post.type, metrics?.hasMore, loadingMore]);

  useEffect(() => {
    const itemType = post.type === "video" ? "video" : "image";
    dispatch(setActiveItem({ id: post._id, type: itemType }));

    // Initial fetch with limit
    dispatch(
      fetchComments({
        itemId: post._id,
        itemType,
        limit: 15,
      })
    );

    const handleCommentCreated = (data: {
      itemId: string;
      itemType: "post" | "reel";
      comment: {
        [key: string]: unknown;
        id: string;
        authorId: string;
        text: string;
        createdAt: string;
        updatedAt?: string;
      };
    }) => {
      if (data.itemId === post._id) {
        const mappedComment = {
          _id: data.comment.id,
          author: {
            _id: data.comment.authorId,
            username: "Người dùng",
            fullname: "",
            profilePicture: "",
          },
          text: data.comment.text as string,
          createdAt: data.comment.createdAt as string,
          updatedAt: data.comment.updatedAt as string | undefined,
          replies: [],
        };
        dispatch({
          type: "comments/handleSocketCommentCreated",
          payload: {
            ...mappedComment,
            itemId: data.itemId,
            itemType: data.itemType,
          },
        });
      }
    };

    const handleCommentEdited = (data: {
      commentId: string;
      newText: string;
      itemId: string;
    }) => {
      if (data.itemId === post._id) {
        dispatch({
          type: "comments/handleSocketCommentEdited",
          payload: data,
        });
      }
    };

    const handleCommentDeleted = (data: {
      itemId: string;
      commentId: string;
    }) => {
      if (data.itemId === post._id) {
        dispatch({
          type: "comments/handleSocketCommentDeleted",
          payload: data,
        });
      }
    };

    type TypingData = {
      itemId: string;
      user: {
        id: string;
        username: string;
        profilePicture?: string;
      };
    };

    const handleTyping = (data: TypingData) => {
      if (data.itemId === post._id) {
        dispatch({ type: "comments/handleSocketTyping", payload: data });
      }
    };

    const handleStopTyping = (data: {
      itemId: string;
      userId: string;
      username?: string;
      profilePicture?: string;
    }) => {
      if (data.itemId === post._id) {
        const typingData: TypingData = {
          itemId: data.itemId,
          user: {
            id: data.userId,
            username: data.username || "Unknown",
            profilePicture: data.profilePicture,
          },
        };
        dispatch({
          type: "comments/handleSocketStopTyping",
          payload: typingData,
        });
      }
    };

    const handleCommentReacted = (data: {
      commentId: string;
      reaction: string;
      user: { id: string; username: string; profilePicture?: string };
    }) => {
      dispatch({
        type: "comments/handleSocketCommentReacted",
        payload: {
          commentId: data.commentId,
          userId: data.user.id,
          reaction: data.reaction,
          user: data.user,
        },
      });
    };

    socketService.onCommentCreated(handleCommentCreated);
    socketService.onCommentEdited(handleCommentEdited);
    socketService.onCommentDeleted(handleCommentDeleted);
    socketService.onCommentTyping(handleTyping);
    socketService.onCommentStopTyping(handleStopTyping);
    socketService.onCommentReacted(handleCommentReacted);

    return () => {
      socketService.offCommentCreated(handleCommentCreated);
      socketService.offCommentEdited(handleCommentEdited);
      socketService.offCommentDeleted(handleCommentDeleted);
      socketService.offCommentTyping(handleTyping);
      socketService.offCommentStopTyping(handleStopTyping);
      socketService.offCommentReacted(handleCommentReacted);
      dispatch(clearActiveItem());
    };
  }, [dispatch, post._id, post.type]);

  // Add scroll listener
  useEffect(() => {
    const listElement = commentsListRef.current;
    if (listElement) {
      listElement.addEventListener("scroll", handleScroll);
      return () => listElement.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Phần content chính
  const commentsContent = (
    <>
      {loading ? (
        <div className={styles.loadingComments}>
          <p>Đang tải bình luận...</p>
        </div>
      ) : error ? (
        <div className={styles.errorComments}>
          <p>Lỗi khi tải bình luận: {error}</p>
        </div>
      ) : comments && comments.length > 0 ? (
        <div
          className={styles.commentsList}
          ref={commentsListRef}
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            paddingRight: "8px",
          }}
        >
          {comments.map((comment, index) => (
            <CommentWithReplies
              key={`${comment._id}-${index}`} // Fallback key với index
              comment={comment}
              onReply={handleReply}
            />
          ))}

          {/* Load more indicator */}
          {loadingMore && (
            <div className={styles.loadingMore}>
              <p>Đang tải thêm bình luận...</p>
            </div>
          )}

          {/* Show total comments info */}
          {metrics && (
            <div className={styles.commentsInfo}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#888",
                  textAlign: "center",
                  margin: "10px 0",
                  padding: "5px",
                }}
              >
                {metrics.hasMore && !loadingMore && " • Cuộn xuống để xem thêm"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noComments}>
          <h3>Chưa có bình luận nào.</h3>
          <p>Bắt đầu trò chuyện.</p>
        </div>
      )}
    </>
  );

  // Nếu có onClose (mobile view), wrap với commentsSectionMobile
  if (onClose) {
    return (
      <div
        className={`${styles.commentsSectionMobile} ${styles[animationClass]}`}
        onClick={handleCommentsClick}
      >
        {/* Header với tiêu đề và nút đóng */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: "600",
              textAlign: "center",
              flex: 1,
            }}
          >
            Bình luận
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X size={24} />
          </button>
        </div>
        <div className={styles.commentsSection}>{commentsContent}</div>
        <CommentInput
          post={post}
          replyTo={replyTo}
          onReplyCancel={handleReplyCancel}
          inputStyle={{
            border: "1px solid #808080",
            borderRadius: "20px",
            padding: "5px 12px",
          }}
        />
      </div>
    );
  }

  // Nếu không có onClose (desktop view), chỉ dùng commentsSection
  return <div className={styles.commentsSection}>{commentsContent}</div>;
}
