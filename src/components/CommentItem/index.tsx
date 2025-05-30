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
              }}
            >
              {comment.author.fullname || comment.author.username}
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
