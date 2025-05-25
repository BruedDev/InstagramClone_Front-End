import Image from "next/image";
import {
  SendHorizontal,
  Smile,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import styles from "./Messenger.module.scss";
import type { User, Message } from "@/types/user.type";
import { useEffect, useRef, useState, useCallback } from "react";
import Call from "./call";
import { useTime } from "@/app/hooks/useTime";
import { useCheckOnline } from "@/app/hooks/useCheckOnline";
import { useTimeOffline } from "@/app/hooks/useTimeOffline";
import { OnlineIndicator } from "@/components/OnlineIndicator";

export type MainChatProps = {
  selectedUser: User | null;
  messages: Message[];
  message: string;
  setMessage: (msg: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  loading: boolean;
  userId: string;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;
  availableUsers: User[];
  showMainChat: boolean;
  setShowMainChat: (show: boolean) => void;
};

export default function MainChat({
  selectedUser,
  messages,
  message,
  setMessage,
  handleSendMessage,
  handleKeyPress,
  loading,
  userId,
  onLoadMore,
  hasMore,
  loadingMore,
  ringtoneRef,
  availableUsers,
  showMainChat,
  setShowMainChat,
}: MainChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldMaintainScrollPosition, setShouldMaintainScrollPosition] =
    useState(false);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(0);
  const { formatTime } = useTime();

  const { isUserOnline } = useCheckOnline(availableUsers);
  const { timeOffline } = useTimeOffline(
    selectedUser?.lastActive !== null && selectedUser?.lastActive !== undefined
      ? String(selectedUser.lastActive)
      : null,
    selectedUser?.lastOnline !== null && selectedUser?.lastOnline !== undefined
      ? String(selectedUser.lastOnline)
      : null,
    isUserOnline(selectedUser?._id || "") ? "online" : "offline"
  );

  // Simple scroll handler - only load more when at top
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || loadingMore) return;

    const { scrollTop } = messagesContainerRef.current;

    // Load more when scrolled to top and has more messages
    if (scrollTop === 0 && hasMore) {
      const { scrollHeight } = messagesContainerRef.current;
      setPreviousScrollHeight(scrollHeight);
      setShouldMaintainScrollPosition(true);
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  // Maintain scroll position after loading more messages
  useEffect(() => {
    if (
      shouldMaintainScrollPosition &&
      messagesContainerRef.current &&
      !loadingMore
    ) {
      const { scrollHeight } = messagesContainerRef.current;
      const scrollDifference = scrollHeight - previousScrollHeight;
      messagesContainerRef.current.scrollTop = scrollDifference;
      setShouldMaintainScrollPosition(false);
    }
  }, [loadingMore, shouldMaintainScrollPosition, previousScrollHeight]);

  // Auto scroll to bottom for new messages (only if user is near bottom)
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  // Scroll to bottom when user changes (instant, no animation)
  useEffect(() => {
    if (selectedUser && messagesEndRef.current) {
      // Instant scroll to bottom when switching users
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [selectedUser]);

  const getActivityStatus = (user: User) => {
    if (!user) return "";
    return timeOffline;
  };

  const generateMessageKey = (msg: Message, index: number) => {
    if (msg._id) {
      return `${msg._id}-${index}`;
    }
    return `temp-${msg.senderId}-${Date.now()}-${index}`;
  };

  return (
    <div
      className={`flex-1 flex flex-col bg-[#111] ${styles.mainChat} ${
        showMainChat ? styles.showMainChat : ""
      }`}
    >
      <style jsx>{`
        @media (max-width: 622px) {
          .${styles.backBtn} {
            display: block !important;
          }
        }
      `}</style>

      {/* Chat Header */}
      <div
        className={`flex justify-between items-center p-4 border-b border-[#222] position-relative bg-[#0f0f0f] ${styles.chatHeader}`}
      >
        {selectedUser ? (
          <>
            <div className="flex items-center">
              <button
                className={styles.backBtn}
                onClick={() => setShowMainChat(false)}
                style={{
                  marginRight: 8,
                  display: "none",
                }}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="w-10 h-10 rounded-full mr-3 relative">
                {selectedUser.profilePicture ? (
                  <Image
                    src={selectedUser.profilePicture}
                    alt={selectedUser.username}
                    fill
                    className={`object-cover ${styles.profilePicture}`}
                    style={{ borderRadius: "50%" }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <OnlineIndicator isOnline={isUserOnline(selectedUser._id)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p
                    className={`font-medium ${styles.text2} ${styles.username}`}
                  >
                    {selectedUser.username}
                  </p>
                  {selectedUser.checkMark && (
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
                <p className={`text-xs text-gray-400 ${styles.text2}`}>
                  {getActivityStatus(selectedUser)}
                </p>
              </div>
            </div>
            <Call
              userId={userId}
              calleeId={selectedUser._id}
              ringtoneRef={ringtoneRef}
              availableUsers={availableUsers}
            />
          </>
        ) : (
          <div className="w-full text-center text-gray-500 min-h-[28px]"></div>
        )}
      </div>

      {/* Messages */}
      {selectedUser ? (
        <div
          className={`flex-1 overflow-y-auto p-4 bg-[#111] ${styles.messages}`}
          ref={messagesContainerRef}
          onScroll={handleScroll}
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Simple loading indicator at top */}
          {loadingMore && (
            <div className="flex justify-center py-2 mb-4">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          )}

          {loading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg, index) => {
              const isCurrentUser = msg.senderId === userId;
              const messageKey = generateMessageKey(msg, index);

              return (
                <div
                  key={messageKey}
                  className={`flex mb-4 ${isCurrentUser ? "justify-end" : ""}`}
                >
                  {!isCurrentUser && (
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2 relative flex-shrink-0">
                      {selectedUser.profilePicture ? (
                        <Image
                          src={selectedUser.profilePicture}
                          alt={selectedUser.username}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs">
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="max-w-md">
                    <div
                      className={`flex items-start mb-1 ${
                        isCurrentUser ? "justify-end" : ""
                      }`}
                    >
                      {isCurrentUser && (
                        <button className="mr-2 text-gray-500 hover:text-gray-300 flex-shrink-0">
                          <Smile className="h-4 w-4" />
                        </button>
                      )}
                      <div
                        className={`${
                          isCurrentUser ? "bg-blue-600" : "bg-[#222]"
                        } rounded-lg p-3 break-words`}
                      >
                        <p className={`${styles.text}`}>{msg.message}</p>
                      </div>
                      {!isCurrentUser && (
                        <button className="ml-2 text-gray-500 hover:text-gray-300 flex-shrink-0">
                          <Smile className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`flex ${isCurrentUser ? "justify-end" : ""}`}
                    >
                      <p className="text-xs text-gray-500">
                        {formatTime(
                          typeof msg.createdAt === "number"
                            ? new Date(msg.createdAt)
                            : !isNaN(Number(msg.createdAt))
                            ? new Date(Number(msg.createdAt))
                            : msg.createdAt,
                          "HH:mm"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-400">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#111] text-gray-500">
          Chọn một cuộc trò chuyện hoặc bắt đầu một cuộc trò chuyện mới
        </div>
      )}

      {/* Message Input */}
      {selectedUser && (
        <div
          className={`border-t border-[#222] p-4 bg-[#111] ${styles.messageInput}`}
        >
          <div className="flex items-center">
            <Smile className="h-6 w-6 mr-3 text-gray-400 cursor-pointer hover:text-gray-200 flex-shrink-0" />
            <div className="flex-1 bg-[#1a1a1a] rounded-full border border-[#222] flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message..."
                className="flex-1 bg-transparent px-4 py-2 focus:outline-none"
              />
              <button className="mr-2 hover:text-gray-200 flex-shrink-0">
                <ImageIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <button
              className="ml-3 text-gray-400 hover:text-gray-200 flex-shrink-0"
              onClick={handleSendMessage}
            >
              <div className="flex items-center justify-center h-8 w-8">
                {message ? (
                  <SendHorizontal className="h-5 w-5 text-blue-500" />
                ) : (
                  <SendHorizontal className="h-5 w-5" />
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
