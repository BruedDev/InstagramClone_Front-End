import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import styles from "./Messenger.module.scss";
import type { User, Message } from "@/types/user.type";
import { useEffect, useRef, useState, useCallback } from "react";
import Call from "./call";
import { useTime } from "@/app/hooks/useTime";
import { useCheckOnline } from "@/app/hooks/useCheckOnline";
import { useTimeOffline } from "@/app/hooks/useTimeOffline";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import StoryAvatar from "@/components/Story/StoryAvatar";
import { useHandleUserClick } from "@/utils/useHandleUserClick";
import MessageInput from "./MessageInput";
import ReplyMessageContent from "./ReplyMessage";

// Extend User type to allow hasStory for MainChat
export type MainChatProps = {
  selectedUser: (User & { hasStory?: boolean }) | null;
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
  const handleUserClick = useHandleUserClick();
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

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current) return;
    if (loadingMore) return;
    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    if (isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages.length, loadingMore]);

  // Scroll to bottom khi vào MainChat hoặc đổi user
  const prevUserIdRef = useRef<string | null>(null);
  const prevLoadingRef = useRef<boolean>(true);

  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    const prevLoading = prevLoadingRef.current;
    const currentUserId = selectedUser?._id || null;

    if (
      messagesEndRef.current &&
      currentUserId &&
      messages.length > 0 &&
      (prevUserId !== currentUserId || (prevLoading && !loading))
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
    prevUserIdRef.current = currentUserId;
    prevLoadingRef.current = loading;
  }, [selectedUser?._id, loading, messages.length]);

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

  // Hàm scroll đến tin nhắn gốc khi click reply - Highlight bubble tin nhắn
  const handleReplyClick = (replyToId: string) => {
    const el = document.getElementById(`message-${replyToId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Tìm bubble tin nhắn chính bên trong container
      const messageBubble = el.querySelector(".message-bubble");
      if (messageBubble) {
        messageBubble.classList.add("ring-2", "ring-white");
        setTimeout(() => {
          messageBubble.classList.remove("ring-2", "ring-white");
        }, 1200);
      }
    }
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
              <div className="w-10 h-10 rounded-full mr-4 relative">
                <StoryAvatar
                  author={selectedUser}
                  hasStories={!!selectedUser.hasStory}
                  variant="messenger"
                  size="large"
                  showUsername={false}
                  initialIndex={0}
                />
                <OnlineIndicator
                  isOnline={isUserOnline(selectedUser._id)}
                  className="absolute bottom-[-5] right-[-8px]"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p
                    className={`font-medium ${styles.text2} ${styles.username}`}
                    onClick={() => handleUserClick(selectedUser.username)}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    {selectedUser.username}
                  </p>
                  {selectedUser.checkMark && (
                    <Image
                      src="/icons/checkMark/checkMark.png"
                      alt="check mark"
                      width={12}
                      height={12}
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
            position: "relative",
          }}
        >
          {/* Loading indicator at top */}
          {loadingMore && (
            <div className="flex justify-center py-2 mb-4">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Overlay spinner when loading new conversation */}
          {loading && messages.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(17,17,17,0.7)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          )}

          {loading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg, index) => {
              function getId(id: unknown): string {
                if (!id) return "";
                if (typeof id === "string") return id;
                if (
                  typeof id === "object" &&
                  id !== null &&
                  "_id" in id &&
                  typeof (id as { _id: unknown })._id === "string"
                ) {
                  return (id as { _id: string })._id;
                }
                return "";
              }
              const msgSenderId = getId(msg.senderId);
              const msgReceiverId = getId(msg.receiverId);
              const isCurrentUser = msgSenderId === userId;
              const isOtherUser =
                selectedUser &&
                (msgSenderId === selectedUser._id ||
                  msgReceiverId === selectedUser._id);
              const messageKey = generateMessageKey(msg, index);

              // Chỉ render tin nhắn thuộc về cuộc hội thoại này
              if (!isOtherUser && !isCurrentUser) return null;

              return (
                <div
                  key={messageKey}
                  id={`message-${msg._id}`}
                  className={`flex mb-4 ${isCurrentUser ? "justify-end" : ""}`} // Tăng margin-bottom từ mb-2 lên mb-4
                >
                  {!isCurrentUser && (
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-3 relative flex-shrink-0">
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
                      className={`flex flex-col ${
                        isCurrentUser ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Container cho reply + tin nhắn chính - KHÔNG dùng position relative */}
                      <div
                        className={`flex flex-col ${
                          isCurrentUser ? "items-end" : "items-start"
                        } max-w-xs gap-1`} // Thêm gap-1 để tạo khoảng cách
                      >
                        {/* Tin nhắn được reply (nếu có) - Bỏ position absolute */}
                        {msg.replyTo && (
                          <div
                            className={`${
                              isCurrentUser ? "bg-[#333]" : "bg-[#333]"
                            } rounded-xl px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity mb-1 max-w-full`}
                            style={{ marginBottom: "-5px" }}
                            onClick={() => {
                              const repliedMsgId =
                                typeof msg.replyTo === "string"
                                  ? msg.replyTo
                                  : msg.replyTo;
                              if (repliedMsgId) handleReplyClick(repliedMsgId);
                            }}
                          >
                            <ReplyMessageContent
                              replyTo={msg.replyTo}
                              availableUsers={availableUsers}
                              messages={messages}
                              userId={userId}
                              isCurrentUser={isCurrentUser}
                            />
                          </div>
                        )}

                        {/* Tin nhắn chính */}
                        <div
                          className={`message-bubble ${
                            isCurrentUser ? "bg-blue-600" : "bg-[#222]"
                          } rounded-3xl px-4 py-3 break-words ${
                            msg.replyTo
                              ? isCurrentUser
                                ? "rounded-tr-lg"
                                : "rounded-tl-lg"
                              : ""
                          }`}
                          style={{
                            borderRadius: msg.replyTo
                              ? isCurrentUser
                                ? "24px 8px 24px 24px"
                                : "8px 24px 24px 24px"
                              : "24px",
                          }}
                        >
                          <p
                            className={`${styles.text} text-white text-sm leading-relaxed`}
                          >
                            {msg.message}
                          </p>
                        </div>
                      </div>

                      {/* Thời gian tin nhắn */}
                      <p className="text-xs text-gray-500 mt-1 px-1">
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
      <MessageInput
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
      />
    </div>
  );
}
