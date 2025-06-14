import { useState, useEffect } from "react";
import styles from "./StoryRing.module.scss";

interface StoryRingProps {
  hasStories: boolean;
  isViewed?: boolean;
  size?: "small" | "medium" | "large";
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function StoryRing({
  hasStories,
  isViewed = false,
  size = "medium",
  children,
  onClick,
  className = "",
}: StoryRingProps) {
  const [internalViewed, setInternalViewed] = useState(isViewed);
  const [animationKey, setAnimationKey] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false); // Thêm state để control animation

  useEffect(() => {
    setInternalViewed(isViewed);
    // Reset shouldAnimate khi isViewed thay đổi từ bên ngoài
    setShouldAnimate(false);
  }, [isViewed]);

  // Reset shouldAnimate sau khi animation hoàn thành (2s)
  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 2000); // Thời gian animation dashAnimation là 2s

      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  const handleClick = () => {
    if (hasStories && !internalViewed) {
      setInternalViewed(true);
    }

    // Trigger animation lại từ đầu mỗi lần click
    setAnimationKey((prev) => prev + 1);
    setShouldAnimate(true); // Set animate = true mỗi lần click

    onClick?.();
  };

  const sizeClasses = {
    small: {
      container: "w-12 h-12",
      svg: "w-[50px] h-[50px]",
      radius: "23",
      strokeWidth: "2",
    },
    medium: {
      container: "w-16 h-16",
      svg: "w-[67px] h-[67px]",
      radius: "31.5",
      strokeWidth: "2.5",
    },
    large: {
      container: "w-20 h-20",
      svg: "w-[170px] h-[170px]",
      radius: "39.5",
      strokeWidth: "3",
    },
  };

  const currentSize = sizeClasses[size];
  const center =
    parseFloat(currentSize.radius) + parseFloat(currentSize.strokeWidth);

  if (!hasStories) {
    return (
      <div
        className={`${currentSize.container} ${className}`}
        onClick={handleClick}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`relative ${styles.container} ${className} cursor-pointer`}
      onClick={handleClick}
    >
      {/* SVG Ring với animation - thêm key để reset animation */}
      <svg
        key={animationKey}
        className={`absolute inset-0 ${currentSize.svg} -rotate-90`}
        viewBox={`0 0 ${center * 2} ${center * 2}`}
      >
        <defs>
          <linearGradient
            id={`storyGradient-${size}-${animationKey}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>

        {/* Main circle */}
        <circle
          cx={center}
          cy={center}
          r={currentSize.radius}
          fill="none"
          stroke={
            internalViewed
              ? "rgba(255, 255, 255, 0.3)"
              : `url(#storyGradient-${size}-${animationKey})`
          }
          strokeWidth={currentSize.strokeWidth}
          strokeDasharray={internalViewed ? "8 4" : "0"}
          className={`${styles.storyCircle} ${
            internalViewed ? styles.viewed : ""
          } ${shouldAnimate ? styles.dashAnimation : ""}`} // Chỉ thêm dashAnimation class khi shouldAnimate = true
        />
      </svg>

      <div className="w-full h-full rounded-full bg-black flex items-center justify-center cursor-pointer">
        {children}
      </div>
    </div>
  );
}
