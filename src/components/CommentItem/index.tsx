import { Comment as CommentType } from "@/store/comment";
import styles from "@/components/Modal/Post/PostModal.module.scss";
import Image from "next/image";
import { useTime } from "@/app/hooks/useTime";
import { Heart } from "lucide-react";
import { MentionText } from "@/components/MentionText";

// Interface for reply data
export interface ReplyData {
  commentId: string;
  username: string;
  fullname?: string;
}

// Component hiển thị một comment riêng lẻ (không có nested structure)
export const CommentItem = ({
  comment,
  isReply = false,
  onReply,
}: {
  comment: CommentType;
  isReply?: boolean;
  onReply: (replyData: ReplyData) => void;
}) => {
  const { fromNow } = useTime();

  const marginLeft = isReply ? 20 : 0;
  const showBorder = isReply;

  const handleReplyClick = () => {
    onReply({
      commentId: comment._id,
      username: comment.author.username,
      fullname: comment.author.fullname,
    });
  };

  return (
    <div
      className={styles.commentItem}
      style={{
        marginLeft: marginLeft + "px",
        borderLeft: showBorder ? "2px solid rgba(255,255,255,0.2)" : "none",
        paddingLeft: showBorder ? "16px" : "0",
        position: "relative",
        marginBottom: "16px",
      }}
    >
      {/* Phần tử trang trí hình chữ L cho replies */}
      {isReply && (
        <div
          style={{
            position: "absolute",
            left: "-2px",
            top: "0",
            width: "16px",
            height: "24px",
            borderBottom: "2px solid rgba(255,255,255,0.2)",
            borderLeft: "2px solid rgba(255,255,255,0.2)",
            borderBottomLeftRadius: "8px",
          }}
        />
      )}

      <div style={{ display: "flex", gap: "12px" }}>
        <div className={styles.commentAvatar}>
          <Image
            src={comment.author.profilePicture || "/default-avatar.png"}
            alt={comment.author.username}
            width={isReply ? 32 : 40}
            height={isReply ? 32 : 40}
            className="rounded-full"
            style={{
              border: "2px solid rgba(255,255,255,0.3)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span
              className={styles.commentAuthor}
              style={{
                fontSize: isReply ? "14px" : "16px",
                fontWeight: isReply ? "500" : "600",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {comment.author.fullname || comment.author.username}
              {comment.author.checkMark && (
                <svg
                  aria-label="Đã xác minh"
                  fill="#0095F6"
                  height="12"
                  role="img"
                  viewBox="0 0 40 40"
                  width="12"
                  style={{ marginLeft: 4 }}
                >
                  <title>Đã xác minh</title>
                  <path
                    d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                    fillRule="evenodd"
                  ></path>
                </svg>
              )}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                justifyContent: "flex-start",
              }}
            >
              <Heart
                size={isReply ? 16 : 18}
                style={{
                  color: "#ffffff",
                  cursor: "pointer",
                  opacity: 0.7,
                }}
              />
              <span
                style={{
                  fontSize: isReply ? "12px" : "13px",
                  fontWeight: "600",
                  color: "#ffffff",
                  lineHeight: "1",
                  textAlign: "center",
                }}
              >
                {comment.likes || 0}
              </span>
            </div>
          </div>

          <MentionText
            text={comment.text || ""}
            className={styles.text}
            style={{
              fontSize: isReply ? "14px" : "15px",
              lineHeight: "1.4",
              color: "#ffffff",
              marginBottom: "8px",
              display: "block",
            }}
          />

          <div
            className={styles.commentTime}
            style={{
              fontSize: isReply ? "12px" : "13px",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {fromNow(comment.createdAt)}
            <button
              onClick={handleReplyClick}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer",
                fontSize: "inherit",
                fontWeight: "500",
              }}
            >
              Trả lời
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
