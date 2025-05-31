import React from "react";
import { Plus } from "lucide-react";
import styles from "./AddStory.module.scss";
import IsProfile from "../isProfile";
import RenderStories from "./RenderStories";

interface Story {
  id: string | number;
  username: string;
  profilePicture?: string;
}

interface AddStoryProps {
  stories?: Story[];
  onAddStory?: () => void;
  profileId: string;
}

// Default data nếu không truyền props stories
const defaultStories: Story[] = [
  {
    id: "default-user-1",
    username: "vanloc19_6",
    // Có thể để undefined hoặc một avatar mặc định nếu muốn
  },
];

export default function AddStory({
  stories = defaultStories,
  onAddStory,
  profileId,
}: AddStoryProps) {
  return (
    <div className={`flex flex-row gap-4 p-4 ${styles.container}`}>
      {/* Add Story Button */}
      <IsProfile
        profileId={profileId}
        fallback={<RenderStories stories={stories} />}
      >
        <div
          className="flex flex-col items-center group cursor-pointer"
          onClick={onAddStory}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAddStory?.();
          }}
        >
          <div
            className={`relative w-16 h-16 mb-1 group-hover:scale-105 transition-transform duration-300 ${styles.storyRing}`}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-0.5 group-hover:animate-pulse">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Plus className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-white transition-colors duration-300 font-semibold mt-1">
            Thêm tin mới
          </span>
        </div>
        <RenderStories stories={stories} />
      </IsProfile>
    </div>
  );
}
