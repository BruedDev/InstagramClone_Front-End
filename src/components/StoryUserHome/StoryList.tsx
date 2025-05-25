import Image from "next/image";
import { UserStory } from "@/types/story.type";
import StoryRing from "@/components/StoryRing";

interface StoryListProps {
  userStory: UserStory;
  onClick?: () => void;
}

export default function StoryList({ userStory, onClick }: StoryListProps) {
  return (
    <div
      className="flex flex-col items-center w-full justify-center space-y-1"
      onClick={onClick}
    >
      {/* Avatar Container */}
      <div className="relative w-16 h-16">
        {/* Story Ring - hiển thị nếu user có stories */}
        {userStory.stories.length > 0 ? (
          <StoryRing hasStories={true} size="medium">
            {/* Avatar Image - nằm bên trong story ring */}
            <div
              className="w-[58px] h-[58px] rounded-full overflow-hidden bg-black p-0.5 flex"
              style={{ position: "absolute", top: "5px", left: "5px" }}
            >
              <Image
                src={userStory.user.profilePicture || "/api/placeholder/60/60"}
                alt={userStory.user.username}
                width={56}
                height={56}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            </div>
          </StoryRing>
        ) : (
          /* Avatar Image - không có story ring */
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800">
            <Image
              src={userStory.user.profilePicture || "/api/placeholder/60/60"}
              alt={userStory.user.username}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        )}
      </div>

      {/* Username với CheckMark */}
      <div className="flex items-center justify-center space-x-1 max-w-16 w-full">
        <span className="text-white text-xs truncate">
          {userStory.user.username}
        </span>
        {userStory.user.checkMark && (
          <Image
            src="/icons/checkMark/checkMark.png"
            alt="Verified"
            width={14}
            height={14}
            priority
          />
        )}
      </div>
    </div>
  );
}
