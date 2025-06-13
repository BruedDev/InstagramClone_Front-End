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
    <div style={{ position: "relative", marginBottom: "16px" }}>
      {/* Đường kẻ tree từ cha xuống các replies */}
      {flattenedReplies.length > 0 && (
        <>
          {/* Đường kẻ dọc - điều chỉnh để tới đúng nút button */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 55,
              // Tính toán lại bottom để đường kẻ tới đúng nút button
              bottom: shouldShowCollapseButton
                ? showReplies
                  ? 16
                  : 16 // Điều chỉnh để khớp với L
                : showReplies
                ? 0
                : 16,
              width: 0,
              borderLeft: "2px solid rgba(255,255,255,0.2)",
              zIndex: 0,
              transition: "bottom 0.3s",
            }}
          />
          {/* Đường kẻ chữ L móc vào button "Hiển thị bình luận" */}
          {shouldShowCollapseButton && !showReplies && (
            <div
              style={{
                position: "absolute",
                left: 20,
                bottom: 13, // Điều chỉnh để khớp với button
                width: 28, // Tăng width để L dài hơn
                height: 10, // Giảm height để không thừa
                borderBottom: "2px solid rgba(255,255,255,0.2)",
                borderBottomLeftRadius: "8px",
                zIndex: 1,
                background: "transparent",
              }}
            />
          )}
          {/* Đường kẻ chữ L móc vào button "Ẩn bình luận" */}
          {shouldShowCollapseButton && showReplies && (
            <div
              style={{
                position: "absolute",
                left: 19,
                bottom: 13, // Điều chỉnh để khớp với button ẩn bình luận
                width: 28, // Tăng width để L dài hơn
                height: 12, // Giảm height để không thừa
                borderBottom: "2px solid rgba(255,255,255,0.2)",
                borderBottomLeftRadius: "8px",
                zIndex: 1,
                background: "transparent",
              }}
            />
          )}
        </>
      )}

      {/* Comment gốc */}
      <CommentItem comment={comment} isReply={false} onReply={onReply} />

      {/* Nút collapse/expand nếu tổng số comments >= 3 - vị trí thay đổi */}
      {shouldShowCollapseButton && !showReplies && (
        <div style={{ marginLeft: "48px", marginBottom: "16px" }}>
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
            <ChevronDown size={16} />
            Hiển thị bình luận ({flattenedReplies.length})
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
              isReply={true}
              onReply={onReply}
            />
          ))}
        </div>
      )}

      {/* Nút ẩn bình luận ở cuối khi đang hiển thị replies */}
      {shouldShowCollapseButton && showReplies && (
        <div style={{ marginLeft: "48px", marginTop: "8px" }}>
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
            <ChevronUp size={16} />
            Ẩn bình luận ({flattenedReplies.length})
          </button>
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
