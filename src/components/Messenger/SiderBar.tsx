"use client";

import Image from "next/image";
import styles from "./Messenger.module.scss";
import { ChevronDown, Edit, Search, X, ArrowLeft } from "lucide-react";
import type { User } from "@/types/user.type";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCheckOnline } from "@/app/hooks/useCheckOnline";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import {
  getRecentChats,
  type RecentChat,
  markMessagesAsRead as markMessagesAsReadApi,
} from "@/server/messenger";
import { socketService, type MessageData } from "@/server/socket";
import StoryAvatar from "@/components/Story/StoryAvatar";
import { SiderBarSkeleton, SearchResultsSkeleton } from "@/Skeleton/siderbar";

type UserWithStory = User & { hasStory?: boolean };

type SiderBarProps = {
  availableUsers: UserWithStory[];
  selectedUser: User | null;
  setSelectedUser: (user: User) => void;
  setShowMainChat: (show: boolean) => void;
  userId: string;
  hasStory?: boolean;
  preview?: boolean; // Thêm prop preview
  onClose?: () => void; // Thêm prop onClose
};

interface ExtendedUser extends User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: number;
  bio: string;
  followers: string[];
  following: string[];
  isPrivate: boolean;
  authType: string;
  createdAt: string;
  updatedAt: string;
  isOnline?: boolean;
  hasStory?: boolean;
  className?: string;
}

export default function SiderBar({
  availableUsers,
  selectedUser,
  setSelectedUser,
  setShowMainChat,
  preview = false, // default là false
  onClose,
}: SiderBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const currentUserIdRef = useRef<string | null>(null);
  const [userIdForSocket, setUserIdForSocket] = useState<string | null>(null);

  useEffect(() => {
    let idFromStorage: string | null = null;
    if (typeof window !== "undefined") {
      idFromStorage = localStorage.getItem("id");
    }
    currentUserIdRef.current = idFromStorage;
    setUserIdForSocket(idFromStorage);
  }, []);

  const { isUserOnline } = useCheckOnline(availableUsers);

  const markChatMessageAsRead = useCallback(
    (messageId: string, chatUserId: string) => {
      setRecentChats((prevChats) =>
        prevChats.map((chat) => {
          if (
            chat.user._id === chatUserId &&
            chat.lastMessage &&
            chat.lastMessage._id === messageId &&
            !chat.lastMessage.isOwnMessage
          ) {
            return {
              ...chat,
              lastMessage: {
                ...chat.lastMessage,
                isRead: true,
              },
            };
          }
          return chat;
        })
      );
    },
    []
  );

  const updateRecentChatItem = useCallback(
    (newChatData: RecentChat) => {
      const currentId = currentUserIdRef.current;
      if (
        !newChatData.user ||
        (currentId && newChatData.user._id === currentId)
      ) {
        return;
      }
      setRecentChats((prevChats) => {
        const existingChatIndex = prevChats.findIndex(
          (chat) => chat.user._id === newChatData.user._id
        );
        const chatUserWithOnlineStatus: RecentChat["user"] = {
          ...newChatData.user,
          isOnline: isUserOnline(newChatData.user._id),
        };
        const finalNewChatData = {
          ...newChatData,
          user: chatUserWithOnlineStatus,
        };
        if (existingChatIndex !== -1) {
          const updatedChatsArr = [...prevChats];
          updatedChatsArr[existingChatIndex] = finalNewChatData;
          const [updatedChat] = updatedChatsArr.splice(existingChatIndex, 1);
          return [updatedChat, ...updatedChatsArr];
        } else {
          return [finalNewChatData, ...prevChats];
        }
      });
    },
    [isUserOnline]
  );

  const handleNewMessage = useCallback(
    (messageData: MessageData) => {
      const currentId = currentUserIdRef.current;
      if (!currentId) return;

      const isOwnMessage = messageData.senderId === currentId;
      const chatPartnerId = isOwnMessage
        ? messageData.receiverId
        : messageData.senderId;

      if (chatPartnerId === currentId) return;

      let chatPartnerUser: Partial<ExtendedUser> = {};
      if (isOwnMessage) {
        const receiverDetails =
          availableUsers.find((u) => u._id === messageData.receiverId) ||
          (selectedUser?._id === messageData.receiverId ? selectedUser : null);
        if (receiverDetails) {
          chatPartnerUser = { ...receiverDetails };
        } else {
          chatPartnerUser = {
            _id: messageData.receiverId,
            username: "Unknown Receiver",
          };
        }
      } else {
        if (messageData.author) {
          chatPartnerUser = { ...messageData.author };
        } else {
          const senderDetails = availableUsers.find(
            (u) => u._id === messageData.senderId
          );
          if (senderDetails) {
            chatPartnerUser = { ...senderDetails };
          } else {
            chatPartnerUser = {
              _id: messageData.senderId,
              username: "Unknown Sender",
            };
          }
        }
      }

      const recentChatItem: RecentChat = {
        user: {
          _id: chatPartnerId,
          username: chatPartnerUser.username || "Unknown User",
          profilePicture: chatPartnerUser.profilePicture || "",
          checkMark: chatPartnerUser.checkMark || false,
          isOnline: isUserOnline(chatPartnerId),
          lastActive: String(
            chatPartnerUser.lastActive || new Date().toISOString()
          ),
          lastOnline: String(
            chatPartnerUser.lastOnline || new Date().toISOString()
          ),
        },
        lastMessage: {
          _id: messageData._id,
          message: messageData.message,
          senderId: messageData.senderId,
          isOwnMessage: isOwnMessage,
          createdAt: messageData.createdAt,
          isRead: isOwnMessage ? true : messageData.isRead,
        },
      };
      updateRecentChatItem(recentChatItem);
    },
    [availableUsers, selectedUser, isUserOnline, updateRecentChatItem]
  );

  useEffect(() => {
    if (!userIdForSocket) {
      return;
    }
    socketService.initSocket();
    socketService.registerUser(userIdForSocket);

    const handleIncomingMessageCallback = (data: MessageData) =>
      handleNewMessage(data);
    const handleMessageReadUpdateCallback = (data: {
      messageId: string;
      chatUserId: string;
    }) => markChatMessageAsRead(data.messageId, data.chatUserId);

    socketService.onUpdateMessageRead(handleMessageReadUpdateCallback);
    socketService.onReceiveMessageSiderBar(handleIncomingMessageCallback);

    return () => {
      socketService.offUpdateMessageRead(handleMessageReadUpdateCallback);
      socketService.offReceiveMessageSiderBar(handleIncomingMessageCallback);
    };
  }, [
    userIdForSocket,
    handleNewMessage,
    updateRecentChatItem,
    markChatMessageAsRead,
  ]);

  useEffect(() => {
    const fetchAndSetRecentChats = async () => {
      const userId = currentUserIdRef.current;
      if (!userId) {
        setIsLoading(false);
        setRecentChats([]);
        return;
      }
      try {
        setIsLoading(true);
        const chats = await getRecentChats();
        const filtered = chats.filter(
          (chat) => chat.user && chat.user._id !== userId
        );
        setRecentChats(filtered);
      } catch (error) {
        console.error("Error fetching recent chats:", error);
        setRecentChats([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserIdRef.current && userIdForSocket) {
      fetchAndSetRecentChats();
    } else if (!currentUserIdRef.current) {
      setIsLoading(false);
      setRecentChats([]);
    }
  }, [userIdForSocket]);

  useEffect(() => {
    const currentUserId = currentUserIdRef.current;
    if (!selectedUser || !currentUserId || recentChats.length === 0) {
      return;
    }

    const activeChatInSidebar = recentChats.find(
      (chat) => chat.user._id === selectedUser._id
    );

    if (
      activeChatInSidebar &&
      activeChatInSidebar.lastMessage &&
      !activeChatInSidebar.lastMessage.isOwnMessage &&
      !activeChatInSidebar.lastMessage.isRead
    ) {
      const messageIdToMark = activeChatInSidebar.lastMessage._id;
      const partnerId = activeChatInSidebar.user._id;

      markChatMessageAsRead(messageIdToMark, partnerId);

      markMessagesAsReadApi([messageIdToMark], partnerId).catch((error) => {
        console.error(
          "SiderBar Effect: Lỗi khi tự động đánh dấu tin nhắn đã đọc trên server:",
          error
        );
      });
    }
  }, [selectedUser, recentChats, markChatMessageAsRead]);

  const handleChatClick = (chat: RecentChat) => {
    if (!chat.user) return;
    const currentUserId = currentUserIdRef.current;

    if (
      chat.lastMessage &&
      !chat.lastMessage.isOwnMessage &&
      !chat.lastMessage.isRead &&
      currentUserId
    ) {
      const messageIdToMark = chat.lastMessage._id;
      const partnerId = chat.user._id;

      markChatMessageAsRead(messageIdToMark, partnerId);
      markMessagesAsReadApi([messageIdToMark], partnerId).catch((error) => {
        console.error(
          "SiderBar Click: Lỗi khi đánh dấu tin nhắn đã đọc trên server:",
          error
        );
      });
    }

    const userToSelect: ExtendedUser = {
      _id: chat.user._id,
      username: chat.user.username,
      profilePicture: chat.user.profilePicture ?? "",
      checkMark: chat.user.checkMark ?? false,
      lastActive: chat.user.lastActive ?? "",
      lastOnline: chat.user.lastOnline ?? "",
      id: chat.user._id,
      fullName: (chat.user as ExtendedUser).fullName || chat.user.username,
      email: (chat.user as ExtendedUser).email || "",
      phoneNumber: (chat.user as ExtendedUser).phoneNumber || 0,
      bio: (chat.user as ExtendedUser).bio || "",
      followers: (chat.user as ExtendedUser).followers || [],
      following: (chat.user as ExtendedUser).following || [],
      isPrivate: (chat.user as ExtendedUser).isPrivate || false,
      authType: (chat.user as ExtendedUser).authType || "",
      createdAt: (chat.user as ExtendedUser).createdAt || "",
      updatedAt: (chat.user as ExtendedUser).updatedAt || "",
    };

    setSelectedUser(userToSelect as User);
    setShowMainChat(true);
    if (preview) {
      // Chỉ cập nhật url trên thanh địa chỉ, không điều hướng thật
      window.history.replaceState(null, "", `/messages?id=${chat.user._id}`);
    } else {
      router.push(`/messages?id=${chat.user._id}`);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowMainChat(true);
    if (!preview) {
      router.push(`/messages?id=${user._id}`);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 1) return "Vừa xong";
    if (diffInSeconds < 60) return "Vừa xong";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  };

  const formatMessage = (chat: RecentChat) => {
    const currentId = currentUserIdRef.current;
    if (!currentId) return "";

    const { lastMessage } = chat;
    const isOwn =
      lastMessage.isOwnMessage !== undefined
        ? lastMessage.isOwnMessage
        : lastMessage.senderId === currentId;

    let messageText = lastMessage.message;
    if (messageText && messageText.length > 25) {
      messageText = messageText.substring(0, 25) + "...";
    }

    return isOwn ? `Bạn: ${messageText}` : messageText;
  };

  // Handle search with debouncing
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const filteredChats = recentChats.filter((chat) => {
    const currentId = currentUserIdRef.current;
    return (
      chat.user &&
      chat.user._id !== currentId &&
      chat.user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const chatUserIds = recentChats.map((chat) => chat.user._id);
  const filteredAvailableUsers = availableUsers.filter((user) => {
    const currentId = currentUserIdRef.current;
    return (
      user._id !== currentId &&
      !chatUserIds.includes(user._id) &&
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleBackClick = () => {
    router.push("/");
  };

  // Show full skeleton when initially loading
  if (isLoading && recentChats.length === 0) {
    return <SiderBarSkeleton preview={preview} />;
  }

  return (
    <div
      className={`bg-[#0f0f0f] border-r border-[#222] flex flex-col ${
        preview ? "w-full" : "w-80"
      } ${styles.sidebar}`}
      style={
        preview
          ? {
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              background: "#212328",
            }
          : {}
      }
    >
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#222]">
        <div className="flex items-center">
          <button
            onClick={handleBackClick}
            className="md:hidden w-9 h-9 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center cursor-pointer transition-colors mr-3"
          >
            <ArrowLeft className="h-5 w-5 text-gray-200" />
          </button>
          <h1
            className={`font-bold text-2xl text-white${
              preview ? " !text-lg" : ""
            }`}
            style={preview ? { fontSize: "1.1rem" } : {}}
          >
            Tin Nhắn
          </h1>
          <ChevronDown className="ml-2 h-4 w-4 text-gray-300" />
        </div>
        {preview && onClose ? (
          <button
            className="w-9 h-9 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center cursor-pointer transition-colors"
            onClick={onClose}
            aria-label="Đóng Messenger"
          >
            <X className="h-4 w-4 text-gray-200" />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] flex items-center justify-center cursor-pointer transition-colors">
            <Edit className="h-4 w-4 text-gray-200" />
          </div>
        )}
      </div>

      <div className="px-4 py-3">
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

      <div className={`overflow-y-auto ${styles.chatList}`}>
        <div className="flex px-4 pb-2">
          <button className="flex-1 py-2 px-4 mx-1 rounded-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            Hộp thư
          </button>
          <button className="flex-1 py-2 px-4 mx-1 rounded-full text-sm font-medium text-gray-300 hover:bg-[#1a1a1a] transition-colors">
            Tin nhắn chờ
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {/* Show search skeleton when searching */}
          {isSearching ? (
            <SearchResultsSkeleton />
          ) : (
            <>
              {filteredChats.length > 0 && (
                <>
                  {filteredChats.map((chat) => {
                    if (!chat.user) return null;
                    const isChatSelected =
                      selectedUser && selectedUser._id === chat.user._id;
                    const isOnline = chat.user.isOnline ?? false;
                    const hasUnreadMessage =
                      chat.lastMessage &&
                      !chat.lastMessage.isOwnMessage &&
                      !chat.lastMessage.isRead;
                    const userFromList = availableUsers.find(
                      (u) => u._id === chat.user._id
                    );
                    const hasStory = (userFromList?.hasStory ?? false) === true;

                    return (
                      <div
                        key={chat.user._id}
                        className={`flex items-center p-2 cursor-pointer rounded-lg hover:bg-[#1a1a1a] transition-colors mb-1 ${
                          isChatSelected ? "bg-[#1a1a1a]" : ""
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full mr-3 relative flex-shrink-0">
                          {hasStory ? (
                            <StoryAvatar
                              author={chat.user}
                              hasStories={true}
                              variant="messenger"
                              size="large"
                              showUsername={false}
                              initialIndex={0}
                            />
                          ) : chat.user.profilePicture ? (
                            <Image
                              src={chat.user.profilePicture}
                              alt={chat.user.username}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-full"
                              style={{ cursor: "pointer" }}
                              onClick={() => handleChatClick(chat)}
                            />
                          ) : (
                            <div
                              className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg rounded-full"
                              style={{ cursor: "pointer" }}
                              onClick={() => handleChatClick(chat)}
                            >
                              {chat.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <OnlineIndicator isOnline={isOnline} />
                        </div>

                        <div
                          className="flex-1 min-w-0"
                          onClick={() => handleChatClick(chat)}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p
                              className={`truncate font-medium ${
                                hasUnreadMessage
                                  ? "text-white font-semibold"
                                  : "text-white"
                              }`}
                            >
                              {chat.user.username}
                            </p>
                            {chat.user.checkMark && (
                              <svg
                                aria-label="Đã xác minh"
                                fill="#0095F6"
                                height="12"
                                role="img"
                                viewBox="0 0 40 40"
                                width="12"
                              >
                                <title>Đã xác minh</title>
                                <path
                                  d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                                  fillRule="evenodd"
                                ></path>
                              </svg>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm truncate flex-1 mr-2 ${
                                hasUnreadMessage
                                  ? "text-white font-medium"
                                  : "text-gray-400"
                              }`}
                            >
                              {formatMessage(chat)}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {chat.lastMessage
                                  ? formatTime(chat.lastMessage.createdAt)
                                  : ""}
                              </span>
                              {hasUnreadMessage && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {filteredAvailableUsers.length > 0 && (
                <>
                  {searchQuery && filteredChats.length === 0 && (
                    <hr className="border-gray-700 my-2" />
                  )}
                  {filteredAvailableUsers.map((user) => {
                    const isChatSelected =
                      selectedUser && selectedUser._id === user._id;
                    const isOnline = isUserOnline(user._id);
                    const hasStory = user.hasStory === true;
                    return (
                      <div
                        key={user._id}
                        className={`flex items-center p-2 cursor-pointer rounded-lg hover:bg-[#1a1a1a] transition-colors mb-1 ${
                          isChatSelected ? "bg-[#1a1a1a]" : ""
                        }`}
                        onClick={() => handleUserClick(user)}
                      >
                        <div className="w-12 h-12 rounded-full mr-3 relative flex-shrink-0">
                          {hasStory ? (
                            <StoryAvatar
                              author={user}
                              hasStories={true}
                              variant="messenger"
                              size="small"
                              showUsername={false}
                              initialIndex={0}
                              onClick={() => handleUserClick(user)}
                            />
                          ) : user.profilePicture ? (
                            <Image
                              src={user.profilePicture}
                              alt={user.username}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserClick(user);
                              }}
                              style={{ cursor: "pointer" }}
                            />
                          ) : (
                            <div
                              className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserClick(user);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <OnlineIndicator isOnline={isOnline} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <p className="text-white truncate font-medium">
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
                            <span className="text-sm text-gray-400">
                              Nhấn để bắt đầu trò chuyện
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {filteredChats.length === 0 &&
                filteredAvailableUsers.length === 0 && (
                  <>
                    {searchQuery ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-300 font-medium">
                          Không tìm thấy kết quả
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Thử tìm kiếm với từ khóa khác hoặc kiểm tra danh sách
                          bạn bè.
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
                          Bắt đầu cuộc trò chuyện mới với bạn bè hoặc tìm kiếm
                          người dùng.
                        </p>
                      </div>
                    )}
                  </>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
