// === COMMENT LOGIC: ONLY FETCH API ON INITIAL LOAD ===
// After initial load, all comment updates are handled via socket events (comments:updated).
// Do NOT call API to fetch comments after joining room.
// When sending comment, only dispatch addComment (which emits socket event), do not call API directly.

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  fetchComments,
  setActiveItem,
  clearActiveItem,
  loadMoreComments,
} from "@/store/comment";
import { socketService } from "@/server/socket";
import styles from "@/components/Modal/Post/PostModal.module.scss";
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
      // Lấy itemType động từ post.type
      const itemType = post.type as "post" | "reel" | "image";
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
    // Lấy itemType động từ post.type
    const itemType = post.type as "post" | "reel" | "image";
    dispatch(setActiveItem({ id: post._id, type: itemType }));
    console.log("FE join room post_", post._id); // LOG khi join room

    // Initial fetch with limit (API only ONCE)
    dispatch(
      fetchComments({
        itemId: post._id,
        itemType,
        limit: 15,
      })
    );

    // Lắng nghe event comments:updated từ socket
    const handleCommentsUpdated = (data: {
      comments: unknown[];
      metrics: Record<string, unknown>;
      itemId: string;
      itemType: string;
    }) => {
      if (data.itemId === post._id) {
        const m = data.metrics as unknown;
        const metrics: import("@/store/comment").CommentMetrics = {
          totalComments: (m as { totalComments?: number }).totalComments ?? 0,
          totalReplies: (m as { totalReplies?: number }).totalReplies ?? 0,
          totalLikes: (m as { totalLikes?: number }).totalLikes ?? 0,
          buffedComments: (m as { buffedComments?: number }).buffedComments,
          buffedReplies: (m as { buffedReplies?: number }).buffedReplies,
          hasMore: (m as { hasMore?: boolean }).hasMore ?? false,
        };
        dispatch({
          type: "comments/handleSocketCommentsUpdated",
          payload: {
            ...data,
            comments: data.comments as import("@/store/comment").Comment[],
            metrics,
          },
        });
      }
    };
    socketService.onCommentsUpdated(handleCommentsUpdated);

    return () => {
      socketService.offCommentsUpdated(handleCommentsUpdated);
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

  // Skeleton Loading Component cho Comments
  const CommentSkeleton = () => (
    <div
      style={{
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        {/* Avatar skeleton */}
        <div
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: "#374151",
            borderRadius: "50%",
            flexShrink: 0,
          }}
          className="animate-pulse"
        ></div>

        {/* Content skeleton */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Username skeleton */}
          <div
            style={{
              width: "80px",
              height: "14px",
              backgroundColor: "#374151",
              borderRadius: "4px",
            }}
            className="animate-pulse"
          ></div>

          {/* Comment text skeleton */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                width: "100%",
                height: "16px",
                backgroundColor: "#374151",
                borderRadius: "4px",
              }}
              className="animate-pulse"
            ></div>
            <div
              style={{
                width: "75%",
                height: "16px",
                backgroundColor: "#374151",
                borderRadius: "4px",
              }}
              className="animate-pulse"
            ></div>
          </div>

          {/* Action buttons skeleton */}
          <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
            <div
              style={{
                width: "40px",
                height: "12px",
                backgroundColor: "#374151",
                borderRadius: "4px",
              }}
              className="animate-pulse"
            ></div>
            <div
              style={{
                width: "60px",
                height: "12px",
                backgroundColor: "#374151",
                borderRadius: "4px",
              }}
              className="animate-pulse"
            ></div>
          </div>
        </div>
      </div>

      {/* Reply skeleton (random appearance) */}
      {Math.random() > 0.6 && (
        <div style={{ marginLeft: "44px", marginTop: "12px" }}>
          <div
            style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#374151",
                borderRadius: "50%",
                flexShrink: 0,
              }}
              className="animate-pulse"
            ></div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  width: "60px",
                  height: "12px",
                  backgroundColor: "#374151",
                  borderRadius: "4px",
                  marginBottom: "6px",
                }}
                className="animate-pulse"
              ></div>
              <div
                style={{
                  width: "90%",
                  height: "14px",
                  backgroundColor: "#374151",
                  borderRadius: "4px",
                }}
                className="animate-pulse"
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Skeleton cho danh sách comments
  const CommentsListSkeleton = () => (
    <div
      style={{
        maxHeight: "400px",
        overflowY: "auto",
        paddingRight: "8px",
      }}
    >
      {[...Array(6)].map((_, index) => (
        <CommentSkeleton key={index} />
      ))}
    </div>
  );

  // Phần content chính
  const commentsContent = (
    <>
      {loading ? (
        <CommentsListSkeleton />
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

          {/* Load more skeleton */}
          {loadingMore && (
            <div style={{ padding: "16px 0" }}>
              <CommentSkeleton />
              <CommentSkeleton />
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
