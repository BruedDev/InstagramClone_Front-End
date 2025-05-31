import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useStory } from "@/contexts/StoryContext";
import StoryRingProfile from "../StoryRingProfile";

interface AuthorType {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark?: boolean;
}

interface StoryAvatarProfileProps {
  author: AuthorType;
  hasStories?: boolean;
  showUsername?: boolean;
  className?: string;
  initialIndex?: number;
  hasViewed?: boolean;
  onClick?: () => void | Promise<void>;
  profileOpen?: boolean; // Thêm prop này
}

const StoryAvatarProfile: React.FC<StoryAvatarProfileProps> = ({
  author,
  hasStories = true,
  className = "",
  initialIndex = 0,
  profileOpen, // Nhận prop này
  onClick, // Thêm destructure onClick
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

  const handleClick = async () => {
    if (!hasStories || isStoryContextLoading || !author?._id) return;
    if (profileOpen && onClick) {
      // Nếu ở profile và có onClick, gọi hàm cha để hiển thị modal lựa chọn
      onClick();
    } else {
      // Ở nơi khác, mở story luôn
      await openStory(author, initialIndex);
    }
  };

  return (
    <div
      className={`flex flex-col items-center cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {/* Container chính responsive: 170px desktop, 80px mobile */}
      <div className="relative w-[160px] h-[160px] max-[480px]:w-[70px] max-[480px]:h-[80px]">
        <StoryRingProfile
          hasStories={hasStories}
          isViewed={isCurrentlyViewed}
          className="w-full h-full"
        >
          {/* Avatar container responsive: 150px desktop, 60px mobile */}
          <div className="w-[130px] h-[130px] max-[480px]:w-[70%] max-[480px]:h-[auto] rounded-full overflow-hidden bg-black flex items-center justify-center mx-auto my-auto">
            <Image
              src={author.profilePicture || "/api/placeholder/150/150"}
              alt={author.username}
              width={150}
              height={150}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
        </StoryRingProfile>
      </div>
    </div>
  );
};

export default StoryAvatarProfile;
