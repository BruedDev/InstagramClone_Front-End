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
}

const StoryAvatar: React.FC<StoryAvatarProps> = ({
  author,
  hasStories = true,
  size = "medium",
  showUsername = false,
  className = "",
  initialIndex = 0,
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

  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16",
    large: "w-20 h-20",
  };

  const avatarSizes = {
    small: {
      ring: "w-12 h-12",
      avatar: "w-[42px] h-[42px]",
      ringOffset: "5px",
    },
    medium: {
      ring: "w-16 h-16",
      avatar: "w-[58px] h-[58px]",
      ringOffset: "5px",
    },
    large: {
      ring: "w-20 h-20",
      avatar: "w-[74px] h-[74px]",
      ringOffset: "5px",
    },
  };

  const handleClick = async () => {
    if (!hasStories || isStoryContextLoading || !author?._id) return;
    await openStory(author, initialIndex);
  };

  const currentRingOffset = avatarSizes[size].ringOffset;

  return (
    <div
      className={`flex flex-col items-center cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className={`relative ${sizeClasses[size]}`}>
        <StoryRing
          hasStories={hasStories}
          isViewed={isCurrentlyViewed}
          size={size}
        >
          <div
            className={`${avatarSizes[size].avatar} rounded-full overflow-hidden bg-black p-1 flex`}
            style={{
              position: "absolute",
              top: currentRingOffset,
              left: currentRingOffset,
            }}
          >
            <Image
              src={author.profilePicture || "/api/placeholder/60/60"}
              alt={author.username}
              width={size === "small" ? 42 : size === "medium" ? 58 : 74}
              height={size === "small" ? 42 : size === "medium" ? 58 : 74}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
        </StoryRing>
      </div>

      {showUsername && (
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
