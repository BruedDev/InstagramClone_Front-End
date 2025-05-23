import {
  FormEvent,
  ChangeEvent,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { addComment } from "@/store/comment";
import styles from "@/components/Modal/PostModal.module.scss";
import { X } from "lucide-react";
import { Post } from "@/types/home.type";
import Image from "next/image";
import { useUser } from "@/app/hooks/useUser";

interface ReplyData {
  commentId: string;
  username: string;
  fullname?: string;
}

interface CommentInputProps {
  post: Post;
  comment?: string;
  handleCommentChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmitComment?: (e: FormEvent) => void;
  isSubmitting?: boolean;
  replyTo?: ReplyData | null;
  onReplyCancel?: () => void;
  inputStyle?: React.CSSProperties;
}

export default function CommentInput({
  post,
  comment: externalComment,
  handleCommentChange: externalHandleChange,
  handleSubmitComment,
  isSubmitting = false,
  replyTo,
  onReplyCancel,
  inputStyle,
}: CommentInputProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useUser();

  // Local state for comment input
  const [commentText, setCommentText] = useState(externalComment || "");

  const loading = useSelector(
    (state: RootState) => state.comments.loading[`add_${post._id}`] || false
  );
  const error = useSelector(
    (state: RootState) => state.comments.error[`add_${post._id}`]
  );

  // Determine if we're currently submitting
  const isCurrentlySubmitting = isSubmitting || loading;

  // Effect to handle reply mode
  useEffect(() => {
    if (replyTo) {
      const mentionText = `@${replyTo.username} `;
      setCommentText(mentionText);
    } else {
      // Only clear if we're not externally controlled
      if (externalComment === undefined) {
        setCommentText("");
      }
    }
  }, [replyTo, externalComment]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // If we're in reply mode, ensure the mention stays
      if (replyTo) {
        const mentionText = `@${replyTo.username} `;
        if (!value.startsWith(mentionText)) {
          // If user tries to delete the mention, restore it
          setCommentText(mentionText);
          return;
        }
      }

      setCommentText(value);

      // Call external handler if provided
      if (externalHandleChange) {
        externalHandleChange(e);
      }
    },
    [externalHandleChange, replyTo]
  );

  // Handle submit with Redux - MODIFIED to include mention in the actual comment text
  const handleReduxSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (commentText.trim().length === 0 || isCurrentlySubmitting) {
      return;
    }

    // For replies, we keep the full text including the mention
    let actualCommentText = commentText.trim();

    if (replyTo) {
      const mentionText = `@${replyTo.username} `;
      // Check if there's actual content after the mention
      if (actualCommentText.startsWith(mentionText)) {
        const contentAfterMention = actualCommentText
          .slice(mentionText.length)
          .trim();
        if (contentAfterMention.length === 0) {
          return; // Don't submit if only mention text
        }
        // Keep the full text with mention for display purposes
        actualCommentText = actualCommentText;
      }
    }

    try {
      await dispatch(
        addComment({
          itemId: post._id,
          itemType: post.type,
          text: actualCommentText,
          parentId: replyTo?.commentId,
        })
      ).unwrap();

      // Clear input and reply state after successful submission
      setCommentText("");
      if (onReplyCancel) {
        onReplyCancel();
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // Use custom handler if provided, otherwise use Redux handler
  const submitHandler = handleSubmitComment || handleReduxSubmit;

  // Use external comment value if controlled from parent
  const inputValue =
    externalComment !== undefined ? externalComment : commentText;
  const inputChangeHandler = externalHandleChange || handleInputChange;

  // Calculate if we can submit
  const canSubmit = replyTo
    ? inputValue.length > `@${replyTo.username} `.length
    : inputValue.trim().length > 0;

  return (
    <div>
      {/* Reply indicator */}
      {replyTo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            marginBottom: "8px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          <span>
            Đang trả lời <strong>@{replyTo.username}</strong>
          </span>
          <button
            type="button"
            onClick={onReplyCancel}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={submitHandler} className={styles.commentForm}>
        <div className={styles.avatarContainer}>
          {user && (
            <Image
              src={user.profilePicture}
              alt="Avatar"
              width={30}
              height={30}
              className="rounded-full object-cover"
            />
          )}
        </div>

        <input
          type="text"
          placeholder={
            replyTo ? `Trả lời @${replyTo.username}...` : "Bình luận..."
          }
          value={inputValue}
          onChange={inputChangeHandler}
          className={styles.commentInput}
          disabled={isCurrentlySubmitting}
          autoFocus={!!replyTo} // Auto focus when replying
          style={inputStyle}
        />
        <button
          type="submit"
          className={`${styles.postButton} ${canSubmit ? styles.active : ""}`}
          disabled={!canSubmit || isCurrentlySubmitting}
        >
          {isCurrentlySubmitting ? "Đang đăng..." : "Đăng"}
        </button>
        {error && <div className={styles.errorMessage}>{error}</div>}
      </form>
    </div>
  );
}
