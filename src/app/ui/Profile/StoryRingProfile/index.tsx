import { useState, useEffect } from "react";
import styles from "./StoryRingProfile.module.scss";

interface StoryRingProfileProps {
  hasStories: boolean;
  isViewed?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function StoryRingProfile({
  hasStories,
  isViewed = false,
  children,
  onClick,
  className = "",
}: StoryRingProfileProps) {
  const [internalViewed, setInternalViewed] = useState(isViewed);
  const [animationKey, setAnimationKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false); // Thêm state để control animation

  useEffect(() => {
    setInternalViewed(isViewed);
    // Reset shouldAnimate khi isViewed thay đổi từ bên ngoài
    setShouldAnimate(false);
  }, [isViewed]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 480);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Responsive size config - large desktop, medium mobile
  const sizeConfig = {
    container: "w-20 h-20 max-[480px]:w-20 max-[480px]:h-20",
    svg: "w-[160px] h-[160px] max-[480px]:w-[70px] max-[480px]:h-[80px]",
    radius: "39.5",
    radiusMobile: "18.5",
    strokeWidth: "1.5",
  };

  // Calculate center for both desktop and mobile
  const centerDesktop =
    parseFloat(sizeConfig.radius) + parseFloat(sizeConfig.strokeWidth);

  if (!hasStories) {
    return (
      <div
        className={`${sizeConfig.container} ${className}`}
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
      {/* SVG Ring với animation - responsive với viewBox đúng */}
      <svg
        key={animationKey}
        className={`absolute inset-0 ${sizeConfig.svg} -rotate-90`}
        viewBox={`0 0 ${centerDesktop * 2} ${centerDesktop * 2}`}
      >
        <defs>
          <linearGradient
            id={`storyGradient-large-${animationKey}`}
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

        {/* Main circle - responsive với cùng viewBox */}
        <circle
          cx={centerDesktop}
          cy={centerDesktop}
          r={sizeConfig.radius}
          fill="none"
          stroke={
            internalViewed
              ? "rgba(255, 255, 255, 0.3)"
              : `url(#storyGradient-large-${animationKey})`
          }
          strokeWidth={isMobile ? "3" : "1.5"}
          className={`${styles.storyCircle} ${
            internalViewed ? styles.viewed : ""
          } ${styles.responsiveStroke} ${
            shouldAnimate ? styles.dashAnimation : ""
          }`} // Chỉ thêm dashAnimation class khi shouldAnimate = true
          strokeDasharray={internalViewed ? "8 4" : "0"}
        />
      </svg>

      <div className="w-full h-full rounded-full bg-black flex items-center justify-center cursor-pointer">
        {children}
      </div>
    </div>
  );
}
