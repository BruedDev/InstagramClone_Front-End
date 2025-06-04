import React from "react";
import Image from "next/image";
import { FaPlus } from "react-icons/fa6";
import { useUser } from "@/app/hooks/useUser";

export default function AddStoryItem() {
  const { user } = useUser();

  return (
    <button
      className="flex flex-col items-center space-y-1"
      style={{ cursor: "pointer" }}
    >
      {/* Avatar Container */}
      <div className="relative">
        {/* Avatar Image */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-800">
          <Image
            src={user?.profilePicture || "/api/placeholder/60/60"}
            alt="Thêm tin"
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Add Story Button */}
        <div className="absolute -bottom-0 -right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-black">
          <FaPlus size={12} className="text-black leading-none p-0" />
        </div>
      </div>

      {/* them tin */}
      <span className="text-white text-xs text-center max-w-16 truncate mt-1">
        Tin của bạn
      </span>
    </button>
  );
}
