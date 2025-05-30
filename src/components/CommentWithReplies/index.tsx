import { useEffect, useState } from "react";
import { Comment as CommentType } from "@/store/comment";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CommentItem, ReplyData } from "@/components/CommentItem";
import { flattenReplies, getTotalCommentsCount } from "@/utils/commentUtils";

// Component hiển thị comment với replies được flatten
export const CommentWithReplies = ({
  comment,
  onReply,
}: {
  comment: CommentType;
  onReply: (replyData: ReplyData) => void;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const totalCount = getTotalCommentsCount(comment);
  const shouldShowCollapseButton = totalCount >= 4; // Đếm tổng comment + replies >= 3

  const flattenedReplies = flattenReplies(comment);

  useEffect(() => {
    if (!isInitialized) {
      setShowReplies(!shouldShowCollapseButton);
      setIsInitialized(true);
    }
  }, [shouldShowCollapseButton, isInitialized]);

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Comment gốc */}
      <CommentItem comment={comment} isReply={false} onReply={onReply} />

      {/* Nút collapse/expand nếu tổng số comments >= 3 */}
      {shouldShowCollapseButton && (
        <div style={{ marginLeft: "20px", marginBottom: "12px" }}>
          <button
            onClick={toggleReplies}
            style={{
              border: "none",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "500",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {showReplies ? (
              <>
                <ChevronUp size={16} />
                Ẩn bình luận ({flattenedReplies.length})
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Hiển thị bình luận ({flattenedReplies.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* TẤT CẢ replies được flatten - render ở cùng 1 cấp DOM */}
      {flattenedReplies.length > 0 && showReplies && (
        <div
          style={{
            animation: shouldShowCollapseButton
              ? "fadeIn 0.3s ease-in-out"
              : "none",
          }}
        >
          {flattenedReplies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              isReply={true} // TẤT CẢ đều là reply, không phân biệt cấp độ
              onReply={onReply}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
