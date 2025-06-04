import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useStory } from "@/contexts/StoryContext";
import StoryRing from "@/components/StoryRing";

interface AuthorType {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark?: boolean;
}

interface StoryAvatarProps {
  author: AuthorType;
  hasStories?: boolean;
  size?: "small" | "medium" | "large";
  showUsername?: boolean;
  className?: string;
  initialIndex?: number;
  hasViewed?: boolean;
  onClick?: () => void | Promise<void>;
  variant?: "default" | "messenger"; // Thêm variant
}

const StoryAvatar: React.FC<StoryAvatarProps> = ({
  author,
  hasStories = true,
  size = "medium",
  showUsername = false,
  className = "",
  initialIndex = 0,
  variant = "default", // Mặc định là default
}) => {
  const {
    openStory,
    isLoading: isStoryContextLoading,
    isAuthorViewed,
    viewedStatusVersion,
  } = useStory();
  const [isCurrentlyViewed, setIsCurrentlyViewed] = useState(false);

  useEffect(() => {
    if (author?._id) {
      setIsCurrentlyViewed(isAuthorViewed(author._id));
    }
  }, [author?._id, isAuthorViewed, viewedStatusVersion]);

  // Tuỳ chỉnh size cho messenger
  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16",
    large: "w-20 h-20",
    messenger: "w-12 h-12",
  };

  const avatarSizes = {
    small: {
      ring: "w-12 h-12",
      avatar: "w-[42px] h-[42px]",
      ringOffset: "4px",
      padding: "p-1",
    },
    medium: {
      ring: "w-16 h-16",
      avatar: "w-[58px] h-[58px]",
      ringOffset: "5px",
      padding: "p-1",
    },
    large: {
      ring: "w-20 h-20",
      avatar: "w-[74px] h-[74px]",
      ringOffset: "5px",
      padding: "p-1",
    },
    messenger: {
      ring: "w-12 h-12",
      avatar: "w-10 h-10", // 40x40px cho avatar bên trong
      ringOffset: "0px",
      padding: "p-0",
    },
  };

  const handleClick = async () => {
    if (!hasStories || isStoryContextLoading || !author?._id) return;
    await openStory(author, initialIndex);
  };

  // Nếu là messenger thì dùng size messenger, ngược lại dùng size prop
  const usedSize = variant === "messenger" ? "messenger" : size;
  const currentRingOffset = avatarSizes[usedSize].ringOffset;
  const avatarPadding = avatarSizes[usedSize].padding;

  return (
    <div
      className={`flex flex-col items-center cursor-pointer ${className}`}
      onClick={handleClick}
      style={variant === "messenger" ? { width: 48, height: 48 } : {}}
    >
      <div
        className={`relative ${sizeClasses[usedSize]}`}
        style={variant === "messenger" ? { width: 48, height: 48 } : {}}
      >
        <StoryRing
          hasStories={hasStories}
          isViewed={isCurrentlyViewed}
          size={
            variant === "messenger"
              ? "small"
              : (usedSize as "small" | "medium" | "large")
          }
        >
          <div
            className={`${avatarSizes[usedSize].avatar} rounded-full overflow-hidden bg-black flex ${avatarPadding}`}
            style={
              variant === "messenger"
                ? {
                    position: "absolute",
                    top: 5,
                    left: 5,
                    width: 40,
                    height: 40,
                    padding: "1px",
                  }
                : {
                    position: "absolute",
                    top: currentRingOffset,
                    left: currentRingOffset,
                  }
            }
          >
            <Image
              src={author.profilePicture || "/api/placeholder/60/60"}
              alt={author.username}
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
        </StoryRing>
      </div>

      {/* Nếu là messenger thì không hiển thị username */}
      {showUsername && variant !== "messenger" && (
        <div className="flex items-center justify-center space-x-1 max-w-20 w-full mt-2">
          <span className="text-white text-xs truncate">{author.username}</span>
          {author.checkMark && (
            <svg
              aria-label="Đã xác minh"
              fill="rgb(0, 149, 246)"
              height="12"
              role="img"
              viewBox="0 0 40 40"
              width="12"
            >
              <title>Đã xác minh</title>
              <path
                d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                fill-rule="evenodd"
              ></path>
            </svg>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryAvatar;
