import React from "react";
import { Plus } from "lucide-react";
import styles from "./AddStory.module.scss";

export default function AddStory() {
  return (
    <div className={`flex flex-row gap-4 p-4 ${styles.container}`}>
      {/* Add Story Component */}
      <div className="flex flex-col items-center group cursor-pointer">
        {/* Story ring with Instagram-like gradient */}
        <div
          className={`relative w-16 h-16 mb-1 group-hover:scale-105 transition-transform duration-300 ${styles.storyRing}`}
        >
          {/* Gradient ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-0.5 group-hover:animate-pulse">
            {/* Inner content */}
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Plus className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
        </div>
        {/* Text below the story ring */}
        <span className="text-xs text-gray-400 group-hover:text-white transition-colors duration-300 font-semibold mt-1">
          Thêm tin mới
        </span>
      </div>

      {/* User Story Example */}
      <div className="flex flex-col items-center cursor-pointer">
        {/* Story ring with Instagram-like gradient */}
        <div
          className={`relative w-16 h-16 mb-1 hover:scale-105 transition-transform duration-300 ${styles.storyRing}`}
        >
          {/* Gradient ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-0.5 hover:animate-pulse">
            {/* User image */}
            <div className="w-full h-full rounded-full bg-gray-800 border-2 border-black overflow-hidden">
              <div className="w-full h-full bg-gray-700 flex items-center justify-center overflow-hidden">
                {/* Placeholder for user image */}
                <div className="w-full h-full bg-gradient-to-b from-gray-600 to-gray-800"></div>
              </div>
            </div>
          </div>
        </div>
        {/* Username text */}
        <span className="text-xs text-gray-400 hover:text-white transition-colors duration-300 font-semibold mt-1">
          vanloc19_6
        </span>
      </div>
    </div>
  );
}
