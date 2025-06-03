import Image from "next/image";
import { ArrowLeft, Smile, Reply } from "lucide-react";
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
import { ReplyMessageDisplayText, ReplyMessageBubble } from "./ReplyMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearReplyTo, setReplyTo } from "@/store/messengerSlice";
import {
  MessageSkeleton,
  MessageSkeletonRight,
  MessageSkeletonShort,
  MessageSkeletonRightShort,
  TypingSkeleton,
} from "@/Skeleton/messenger";

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
  // Thêm các props cho file upload
  file?: File | null;
  setFile?: (f: File | null) => void;
  filePreview?: string | null;
  setFilePreview?: (url: string | null) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
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
  file,
  setFile,
  filePreview,
  setFilePreview,
  fileInputRef,
}: MainChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldMaintainScrollPosition, setShouldMaintainScrollPosition] =
    useState(false);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(0);

  // State để theo dõi số lượng tin nhắn trước đó
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
  const dispatch = useAppDispatch();
  const replyTo = useAppSelector((state) => state.messenger.replyTo);

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

  // Auto scroll to bottom cho tin nhắn mới (không áp dụng cho lần đầu load)
  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current) return;
    if (loadingMore) return;

    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 700;

    if (
      !isInitialLoad &&
      messages.length > previousMessageCount &&
      isNearBottom
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // Cập nhật số lượng tin nhắn trước đó
    setPreviousMessageCount(messages.length);
  }, [messages.length, loadingMore, isInitialLoad, previousMessageCount]);

  // Scroll to bottom khi vào MainChat hoặc đổi user (chỉ cho lần đầu)
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
      // Đánh dấu đã load xong lần đầu
      setIsInitialLoad(false);
      setPreviousMessageCount(messages.length);
    }

    // Reset trạng thái khi đổi user
    if (prevUserId !== currentUserId) {
      setIsInitialLoad(true);
      setPreviousMessageCount(0);
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

  // Hàm xử lý emoji reaction (tạm thời chỉ console.log)
  const handleEmojiReaction = (messageId: string) => {
    console.log("Emoji reaction for message:", messageId);
    // TODO: Implement emoji reaction logic
  };

  return (
    <div
      className={`flex-1 flex flex-col bg-[#111] ${styles.mainChat} ${
        showMainChat ? styles.showMainChat : ""
      }`}
    >
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
          {/* Loading indicator at top for loadingMore */}
          {loadingMore && (
            <div className="flex justify-center py-2 mb-4">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Skeleton loading khi đang load tin nhắn ban đầu */}
          {loading && messages.length === 0 ? (
            <div className="space-y-0">
              <MessageSkeleton />
              <MessageSkeletonRightShort />
              <MessageSkeletonShort />
              <MessageSkeletonRight />
              <TypingSkeleton />
              <MessageSkeleton />
              <MessageSkeletonRight />
              <MessageSkeletonShort />
              <MessageSkeletonRight />
              <MessageSkeleton />
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
                  className={`${styles.messageContainer} flex mb-4 ${
                    isCurrentUser ? "justify-end" : ""
                  }`}
                >
                  <div className="max-w-md relative flex">
                    {/* Avatar chỉ hiển thị cho tin nhắn của người khác */}
                    {!isCurrentUser && (
                      <div
                        className={`w-8 h-8 rounded-full overflow-hidden mr-3 relative flex-shrink-0 self-end ${styles.avatarContainer}`}
                      >
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

                    {/* Container cho nội dung tin nhắn */}
                    <div className="flex-1">
                      {/* Message Actions */}
                      <div
                        className={`${styles.messageActions} ${
                          isCurrentUser ? styles.currentUser : styles.otherUser
                        }`}
                      >
                        <button
                          className={`${styles.messageActionBtn} ${styles.emojiBtn}`}
                          onClick={() => handleEmojiReaction(msg._id)}
                          title="Thêm emoji"
                          aria-label="Thêm emoji reaction"
                        >
                          <Smile strokeWidth={2} />
                        </button>
                        <button
                          className={`${styles.messageActionBtn} ${styles.replyBtn}`}
                          onClick={() => dispatch(setReplyTo(msg._id))}
                          title="Trả lời tin nhắn"
                          aria-label="Trả lời tin nhắn này"
                        >
                          <Reply strokeWidth={2} />
                        </button>
                      </div>
                      {/* Container cho reply + tin nhắn chính */}
                      <div
                        className={`flex flex-col ${
                          isCurrentUser ? "items-end" : "items-start"
                        } max-w-xs gap-1`}
                      >
                        {/* Tin nhắn được reply (nếu có) */}
                        {msg.replyTo && (
                          <div
                            className="w-full flex flex-col mb-1"
                            style={{ marginTop: "20px" }}
                          >
                            <ReplyMessageDisplayText
                              replyTo={msg.replyTo}
                              availableUsers={availableUsers}
                              messages={messages}
                              userId={userId}
                              currentMessageSenderId={msgSenderId}
                            />
                            <div
                              className={`$${
                                isCurrentUser
                                  ? "bg-[#24233526]"
                                  : "bg-[#242526]"
                              } rounded-xl  py-2 cursor-pointer  transition-opacity max-w-full`}
                              style={{
                                marginBottom: "-22px",
                              }}
                              onClick={() => {
                                const repliedMsgId =
                                  typeof msg.replyTo === "string"
                                    ? msg.replyTo
                                    : msg.replyTo;
                                if (repliedMsgId)
                                  handleReplyClick(repliedMsgId);
                              }}
                            >
                              <ReplyMessageBubble
                                replyTo={msg.replyTo}
                                // availableUsers={availableUsers}
                                messages={messages}
                                userId={userId}
                              />
                            </div>
                          </div>
                        )}

                        {/* Tin nhắn chính */}
                        <div className="flex flex-col gap-0">
                          {/* Text message bubble (nếu có) */}
                          <style jsx>{`
                            .message-bubble-current {
                              border-radius: 18px 18px 18px 18px;
                            }

                            .message-bubble-other {
                              border-radius: 18px 18px 18px 18px;
                            }

                            .message-bubble-current.has-media {
                              border-radius: 18px 18px 4px 18px;
                            }

                            .message-bubble-other.has-media {
                              border-radius: 18px 18px 18px 4px;
                            }
                          `}</style>

                          {/* Sử dụng với CSS classes */}
                          {msg.message && (
                            <div
                              className={`message-bubble px-4 py-3 ${
                                isCurrentUser ? "bg-blue-600" : "bg-[#242526]"
                              } ${
                                isCurrentUser
                                  ? `message-bubble-current ${
                                      msg.mediaUrl ? "has-media" : ""
                                    }`
                                  : `message-bubble-other ${
                                      msg.mediaUrl ? "has-media" : ""
                                    }`
                              }`}
                            >
                              <p
                                className={`${styles.text} text-white text-sm leading-relaxed`}
                              >
                                {msg.message}
                              </p>
                            </div>
                          )}

                          {/* Media với border-radius kết nối */}
                          {msg.mediaUrl && (
                            <div
                              className="overflow-hidden max-w-[200px]"
                              style={{
                                backgroundColor:
                                  msg.mediaType === "image"
                                    ? "white"
                                    : "transparent",
                                borderRadius: isCurrentUser
                                  ? msg.message
                                    ? msg.replyTo
                                      ? "24px 0px 7px 7px" // Có text và reply: góc trên phải = 0, góc dưới = 7px
                                      : "17px 5px 7px 7px" // Có text: góc trên phải = 0, góc dưới = 7px
                                    : msg.replyTo
                                    ? "24px 0px 7px 7px" // Không text có reply: góc trên phải = 0, góc dưới = 7px
                                    : "24px 0px 7px 7px" // Không text: góc trên phải = 0, góc dưới = 7px
                                  : msg.message
                                  ? msg.replyTo
                                    ? "0px 24px 7px 7px" // Có text và reply: góc trên trái = 0, góc dưới = 7px
                                    : "0px 24px 7px 7px" // Có text: góc trên trái = 0, góc dưới = 7px
                                  : msg.replyTo
                                  ? "0px 24px 7px 7px" // Không text có reply: góc trên trái = 0, góc dưới = 7px
                                  : "0px 24px 7px 7px", // Không text: góc trên trái = 0, góc dưới = 7px
                              }}
                            >
                              {msg.mediaType === "image" ? (
                                <Image
                                  src={msg.mediaUrl}
                                  alt="Shared image"
                                  width={200}
                                  height={150}
                                  className="object-cover w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                  style={{
                                    maxHeight: "200px",
                                    minHeight: "80px",
                                    display: "block",
                                  }}
                                  onClick={() => {
                                    window.open(msg.mediaUrl, "_blank");
                                  }}
                                  onError={() => {
                                    console.error(
                                      "Failed to load image:",
                                      msg.mediaUrl
                                    );
                                  }}
                                />
                              ) : msg.mediaType === "video" ? (
                                <video
                                  src={msg.mediaUrl}
                                  controls
                                  className="w-full h-auto"
                                  style={{
                                    maxHeight: "200px",
                                    minHeight: "80px",
                                    display: "block",
                                    borderRadius: isCurrentUser
                                      ? "24px 0px 7px 7px" // Người login: góc trên phải = 0, góc dưới = 7px
                                      : "0px 24px 7px 7px", // Người khác: góc trên trái = 0, góc dưới = 7px
                                  }}
                                  preload="metadata"
                                  onError={() => {
                                    console.error(
                                      "Failed to load video:",
                                      msg.mediaUrl
                                    );
                                  }}
                                >
                                  <source src={msg.mediaUrl} />
                                  Trình duyệt không hỗ trợ phát video này.
                                </video>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Thời gian tin nhắn */}
                      <p className="text-xs text-gray-500 mt-4 px-1">
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
        replyTo={replyTo}
        clearReplyTo={() => dispatch(clearReplyTo())}
        messages={messages}
        availableUsers={availableUsers}
        userId={userId}
        file={file}
        setFile={setFile}
        filePreview={filePreview}
        setFilePreview={setFilePreview}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}
