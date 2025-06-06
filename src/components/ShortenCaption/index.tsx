import { useState, useRef, useLayoutEffect, useEffect } from "react";

interface ShortenCaptionProps {
  text: string;
  className?: string;
  maxLines?: number;
  showMoreText?: string;
  showLessText?: string;
  renderOverlay?: (
    content: React.ReactNode,
    isExpanded: boolean
  ) => React.ReactNode;
}

export default function ShortenCaption({
  text,
  className = "",
  maxLines = 2,
  showMoreText = "Xem thêm",
  showLessText = "Ẩn xem thêm",
  renderOverlay,
}: ShortenCaptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const [isMeasured, setIsMeasured] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const measureTextHeight = () => {
      if (!containerRef.current || !measureRef.current) return;

      const container = containerRef.current;
      const measurer = measureRef.current;

      // Đặt measurer có cùng style và width với container
      const containerStyles = window.getComputedStyle(container);
      measurer.style.width = containerStyles.width;
      measurer.style.fontSize = containerStyles.fontSize;
      measurer.style.lineHeight = containerStyles.lineHeight;
      measurer.style.fontFamily = containerStyles.fontFamily;
      measurer.style.fontWeight = containerStyles.fontWeight;
      measurer.style.letterSpacing = containerStyles.letterSpacing;

      // Đo chiều cao của text đầy đủ
      const fullHeight = measurer.scrollHeight;

      // Đo chiều cao của text bị giới hạn
      measurer.style.display = "-webkit-box";
      measurer.style.webkitBoxOrient = "vertical";
      measurer.style.webkitLineClamp = maxLines.toString();
      measurer.style.overflow = "hidden";

      const clampedHeight = measurer.offsetHeight;

      // Reset measurer
      measurer.style.display = "";
      measurer.style.webkitBoxOrient = "";
      measurer.style.webkitLineClamp = "";
      measurer.style.overflow = "";

      setShouldShowButton(fullHeight > clampedHeight);
      setIsMeasured(true);
    };

    // Delay để đảm bảo DOM đã render xong
    const timer = setTimeout(measureTextHeight, 0);

    return () => clearTimeout(timer);
  }, [text, maxLines]);

  useEffect(() => {
    // Lắng nghe sự kiện đóng overlay từ bên ngoài (nút Ẩn xem thêm)
    const handler = () => setIsExpanded(false);
    window.addEventListener("shorten-caption-close", handler);
    return () => window.removeEventListener("shorten-caption-close", handler);
  }, []);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  if (!isMeasured) {
    // Render ẩn để đo kích thước
    return (
      <>
        <span ref={containerRef} className={`${className} invisible`}>
          {text}
        </span>

        <span
          ref={measureRef}
          className="absolute -z-50 invisible pointer-events-none"
          style={{
            position: "absolute",
            top: "-9999px",
            left: "-9999px",
          }}
        >
          {text}
        </span>
      </>
    );
  }

  // Nếu có renderOverlay và đang mở rộng, dùng overlay
  if (renderOverlay && isExpanded) {
    return (
      <>
        {renderOverlay(
          <>
            <span
              style={{
                color: "#fafafa",
                fontSize: 16,
                lineHeight: 1.6,
                wordBreak: "break-word",
                width: "100%",
              }}
            >
              {text}
            </span>
          </>,
          isExpanded
        )}
      </>
    );
  }

  // Không dùng overlay, chỉ mở rộng tự nhiên
  return (
    <span ref={containerRef} className={className}>
      {!isExpanded && shouldShowButton ? (
        <span className="flex flex-row">
          <span
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: maxLines,
              overflow: "hidden",
              flex: 1,
            }}
          >
            {text}
          </span>
          <button
            onClick={toggleExpanded}
            className="text-[#8e8e8e] hover:text-[#fafafa] transition-colors  inline"
            style={{
              fontWeight: "normal",
              alignItems: "flex-end",
              display: "flex",
              marginLeft: "2px",
              cursor: "pointer",
            }}
          >
            {showMoreText}
          </button>
        </span>
      ) : (
        <span>
          {text}
          {shouldShowButton && isExpanded && !renderOverlay && (
            <>
              <br />
              <button
                onClick={toggleExpanded}
                className="text-[#8e8e8e] hover:text-[#fafafa] transition-colors"
                style={{
                  fontWeight: "normal",
                  padding: "0",
                  cursor: "pointer",
                }}
              >
                {showLessText}
              </button>
            </>
          )}
        </span>
      )}
    </span>
  );
}
