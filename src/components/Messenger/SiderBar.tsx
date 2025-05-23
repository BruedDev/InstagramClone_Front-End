"use client";

import Image from "next/image";
import styles from "./Messenger.module.scss";
import { ChevronDown, Edit, Search, X, ArrowLeft } from "lucide-react";
import type { User } from "@/types/user.type";
import { useEffect, useState } from "react";
import { getUnreadCount } from "@/server/messenger";
import { useRouter } from "next/navigation";

type SiderBarProps = {
  availableUsers: User[];
  selectedUser: User | null;
  setSelectedUser: (user: User) => void;
  userId: string;
  setShowMainChat: (show: boolean) => void;
};

type UnreadInfo = {
  [userId: string]: {
    unreadCount: number;
    message: string;
  };
};

export default function SiderBar({
  availableUsers,
  selectedUser,
  setSelectedUser,
  userId,
  setShowMainChat,
}: SiderBarProps) {
  const [unreadInfo, setUnreadInfo] = useState<UnreadInfo>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUnread = async () => {
      const info: UnreadInfo = {};
      for (const user of availableUsers) {
        try {
          const res = await getUnreadCount(user._id, userId);
          info[user._id] = res;
        } catch {
          info[user._id] = { unreadCount: 0, message: "" };
        }
      }
      setUnreadInfo(info);
    };
    if (availableUsers.length > 0 && userId) fetchUnread();
  }, [availableUsers, userId]);

  // Filter users based on search query
  const filteredUsers = availableUsers.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBackClick = () => {
    router.push("/"); // Hoặc route bạn muốn quay về, ví dụ: '/home', '/dashboard', etc.
  };

  return (
    <div
      className={`w-80 bg-[#0f0f0f] border-r border-[#222] flex flex-col ${styles.sidebar}`}
    >
      {/* Sidebar Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#222] bg-[#0f0f0f]">
        <div className="flex items-center">
          {/* Back button - chỉ hiện khi màn hình < 768px */}
          <button
            onClick={handleBackClick}
            className="md:hidden w-9 h-9 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center cursor-pointer transition-colors mr-3"
          >
            <ArrowLeft className="h-5 w-5 text-gray-200" />
          </button>

          <h1 className="font-bold text-2xl text-white">Tin Nhắn</h1>
          <ChevronDown className="ml-2 h-4 w-4 text-gray-300" />
        </div>
        <div className="w-9 h-9 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center cursor-pointer transition-colors">
          <Edit className="h-4 w-4 text-gray-200" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-[#0f0f0f]">
        <div
          className={`relative flex items-center bg-[#1a1a1a] rounded-full px-3 py-2 transition-all ${
            isSearchFocused ? "ring-1 ring-blue-500" : ""
          }`}
        >
          <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm trên Messenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="ml-2 w-5 h-5 rounded-full bg-gray-500 hover:bg-gray-400 flex items-center justify-center transition-colors"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#0f0f0f] px-4 pb-2">
        <button
          className="flex-1 py-2 px-4 mx-1 rounded-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          style={{ cursor: "pointer" }}
        >
          Hộp thư
        </button>
        <button
          className="flex-1 py-2 px-4 mx-1 rounded-full text-sm font-medium text-gray-300 hover:bg-[#1a1a1a] transition-colors"
          style={{ cursor: "pointer" }}
        >
          Tin nhắn chờ
        </button>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto bg-[#0f0f0f] px-2 py-1">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const unread = unreadInfo[user._id];
            const isSelected = selectedUser && selectedUser._id === user._id;

            return (
              <div
                key={user._id}
                className={`flex items-center p-2 cursor-pointer rounded-lg hover:bg-[#1a1a1a] transition-colors mb-1 ${
                  isSelected ? "bg-[#1a1a1a]" : ""
                }`}
                onClick={() => {
                  setSelectedUser(user);
                  setShowMainChat(true);
                  router.push(`/messages?id=${user._id}`);
                }}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden mr-3 relative flex-shrink-0">
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={user.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#222] rounded-full"></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <p
                      className={`text-white truncate ${
                        unread && unread.unreadCount > 0
                          ? "font-bold"
                          : "font-medium"
                      }`}
                    >
                      {user.username}
                    </p>
                    {user.checkMark && (
                      <Image
                        src="/icons/checkMark/checkMark.png"
                        alt="check mark"
                        width={16}
                        height={16}
                        className={styles.checkMark}
                        style={{ objectFit: "contain" }}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {unread && unread.message ? (
                      <span
                        className={`text-sm truncate max-w-[160px] ${
                          unread.unreadCount > 0
                            ? "text-white font-medium"
                            : "text-gray-400"
                        }`}
                        title={unread.message}
                      >
                        {unread.message}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Nhấn để bắt đầu trò chuyện
                      </span>
                    )}

                    <div className="flex items-center gap-1 ml-2">
                      {unread && unread.unreadCount > 0 && (
                        <>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {unread.unreadCount > 99
                              ? "99+"
                              : unread.unreadCount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-300 font-medium">Không tìm thấy kết quả</p>
            <p className="text-gray-500 text-sm mt-1">
              Thử tìm kiếm với từ khóa khác
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
              <Edit className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-300 font-medium">
              Không có cuộc trò chuyện nào
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Bắt đầu cuộc trò chuyện mới với bạn bè
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
