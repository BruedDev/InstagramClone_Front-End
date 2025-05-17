"use client";

import Image from "next/image";
import styles from "./Messenger.module.scss";
import { ChevronDown, Edit } from "lucide-react";
import type { User } from "@/types/user.type";
import { useEffect, useState } from "react";
import { getUnreadCount } from "@/server/messenger";
import { useRouter } from "next/navigation"; // ✅ Thêm dòng này

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
  const router = useRouter(); // ✅ Khởi tạo router

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

  return (
    <div
      className={`w-80 border-r border-[#222] flex flex-col ${styles.sidebar}`}
    >
      {/* Sidebar Header */}
      <div className="flex justify-between items-center p-4 border-b border-[#222] bg-[#111]">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg">upvox_</h1>
          <ChevronDown className="ml-2 h-4 w-4" />
        </div>
        <Edit className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-200" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222] bg-[#111]">
        <button
          className="flex-1 py-3 border-b-2 border-[#111] font-medium text-[#111] bg-white"
          style={{ cursor: "pointer" }}
        >
          Tin nhắn
        </button>
        <button
          className="flex-1 py-3 text-gray-500 bg-[#111]"
          style={{ cursor: "pointer" }}
        >
          Tin nhắn chờ
        </button>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto bg-[#111]">
        {availableUsers.length > 0 ? (
          availableUsers.map((user) => {
            const unread = unreadInfo[user._id];
            return (
              <div
                key={user._id}
                className={`flex items-center p-3 cursor-pointer hover:bg-[#222] ${
                  selectedUser && selectedUser._id === user._id
                    ? "bg-[#222]"
                    : ""
                }`}
                onClick={() => {
                  setSelectedUser(user);
                  setShowMainChat(true);
                  router.push(`/messages?id=${user._id}`); // ✅ Thêm dòng này
                }}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden mr-3 relative">
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={user.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex gap-2 items-center">
                    <p className="font-medium">{user.username}</p>
                    {user.checkMark && (
                      <Image
                        src="/icons/checkMark/checkMark.png"
                        alt="check mark"
                        width={14}
                        height={14}
                        className={styles.checkMark}
                        style={{ objectFit: "contain" }}
                      />
                    )}
                  </div>
                  {unread && unread.unreadCount > 0 && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs text-blue-500 font-semibold"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {unread.unreadCount} chưa đọc
                      </span>
                      <span
                        className="text-xs text-gray-400 truncate block max-w-[140px]"
                        title={unread.message}
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                      >
                        {unread.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-gray-500">
            Không có người dùng khả dụng
          </div>
        )}
      </div>
    </div>
  );
}
