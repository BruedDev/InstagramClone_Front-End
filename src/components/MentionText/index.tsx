import React from "react";

interface MentionTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

// Component để hiển thị text với mentions được highlight
export const MentionText: React.FC<MentionTextProps> = ({
  text,
  className,
  style,
}) => {
  // Regex để tìm mentions (@username)
  const mentionRegex = /@([\p{L}\p{N}_]+)/gu;

  // Split text thành các phần, giữ lại mentions
  const parts = text.split(mentionRegex);

  return (
    <span className={className} style={style}>
      {parts.map((part, index) => {
        // Nếu index lẻ, đây là username được mention
        if (index % 2 === 1) {
          return (
            <span
              key={index}
              style={{
                color: "#1877f2", // Màu xanh của Facebook
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => {
                // Có thể thêm logic để navigate đến profile user
                console.log("Clicked on mention:", part);
              }}
            >
              @{part}
            </span>
          );
        }
        // Nếu index chẵn, đây là text thường
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
