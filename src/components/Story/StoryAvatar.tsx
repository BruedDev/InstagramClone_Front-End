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
        <div className="flex items-center justify-center space-x-1 max-w-16 w-full mt-1">
          <span className="text-white text-xs truncate">{author.username}</span>
          {author.checkMark && (
            <Image
              src="/icons/checkMark/checkMark.png"
              alt="Verified"
              width={14}
              height={14}
              priority
            />
          )}
        </div>
      )}
    </div>
  );
};

export default StoryAvatar;
