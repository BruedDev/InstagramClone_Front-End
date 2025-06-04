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
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
  PanInfo,
} from "framer-motion";

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
  file?: File | null;
  setFile?: (f: File | null) => void;
  filePreview?: string | null;
  setFilePreview?: (url: string | null) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  preview?: boolean;
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
  preview = false,
}: MainChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldMaintainScrollPosition, setShouldMaintainScrollPosition] =
    useState(false);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(0);
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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || loadingMore) return;
    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop === 0 && hasMore) {
      const { scrollHeight } = messagesContainerRef.current;
      setPreviousScrollHeight(scrollHeight);
      setShouldMaintainScrollPosition(true);
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

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
    setPreviousMessageCount(messages.length);
  }, [messages.length, loadingMore, isInitialLoad, previousMessageCount]);

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
      setIsInitialLoad(false);
      setPreviousMessageCount(messages.length);
    }

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

  const handleReplyClick = (replyToId: string) => {
    const el = document.getElementById(`message-${replyToId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const messageBubble = el.querySelector(".message-bubble");
      if (messageBubble) {
        messageBubble.classList.add("ring-2", "ring-white");
        setTimeout(() => {
          messageBubble.classList.remove("ring-2", "ring-white");
        }, 1200);
      }
    }
  };

  const handleEmojiReaction = (messageId: string) => {
    console.log("Emoji reaction for message:", messageId);
  };

  const MessageItem = ({ msg, index }: { msg: Message; index: number }) => {
    const msgSenderId = getId(msg.senderId);
    const isCurrentUser = msgSenderId === userId;

    const dragControls = useAnimation();
    const x = useMotionValue(0);

    const LTR_ICON_REVEAL_OFFSET = 80;
    const RTL_ICON_REVEAL_OFFSET = -80;

    const replyIconOpacityLTR = useTransform(
      x,
      [0, LTR_ICON_REVEAL_OFFSET / 2, LTR_ICON_REVEAL_OFFSET],
      [0, 0.5, 1]
    );
    const replyIconOpacityRTL = useTransform(
      x,
      [RTL_ICON_REVEAL_OFFSET, RTL_ICON_REVEAL_OFFSET / 2, 0],
      [1, 0.5, 0]
    );

    const handleDragEnd = (
      event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (!isMobile) return;
      const swipeThreshold = 40;
      if (info.offset.x > swipeThreshold && !isCurrentUser) {
        dispatch(setReplyTo(msg._id));
      } else if (info.offset.x < -swipeThreshold && isCurrentUser) {
        dispatch(setReplyTo(msg._id));
      }
      dragControls.start(
        { x: 0 },
        { type: "spring", stiffness: 300, damping: 30 }
      );
    };

    const messageKeyVal = generateMessageKey(msg, index);

    const msgReceiverId = getId(msg.receiverId);
    const isOtherUserInChat =
      selectedUser &&
      (msgSenderId === selectedUser._id || msgReceiverId === selectedUser._id);

    if (!isCurrentUser && !isOtherUserInChat) return null;

    return (
      <div
        key={messageKeyVal}
        id={`message-${msg._id}`}
        className={`${styles.messageContainer} flex mb-4 relative ${
          isCurrentUser ? "justify-end" : "justify-start"
        }`}
        style={{ overflow: isMobile ? "hidden" : "visible" }}
      >
        {isMobile && !isCurrentUser && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 flex items-center justify-center bg-blue-500 text-white"
            style={{
              width: `${LTR_ICON_REVEAL_OFFSET}px`,
              opacity: replyIconOpacityLTR,
              zIndex: 0,
            }}
          >
            <Reply strokeWidth={2} size={24} />
          </motion.div>
        )}

        {isMobile && isCurrentUser && (
          <motion.div
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-green-500 text-white"
            style={{
              width: `${Math.abs(RTL_ICON_REVEAL_OFFSET)}px`,
              opacity: replyIconOpacityRTL,
              zIndex: 0,
            }}
          >
            <Reply strokeWidth={2} size={24} />
          </motion.div>
        )}

        <motion.div
          className={`w-full flex ${
            isCurrentUser ? "justify-end" : "justify-start"
          }`}
          drag={isMobile ? "x" : false}
          dragConstraints={
            isMobile
              ? isCurrentUser
                ? { left: RTL_ICON_REVEAL_OFFSET, right: 0 }
                : { left: 0, right: LTR_ICON_REVEAL_OFFSET }
              : { left: 0, right: 0 }
          }
          dragElastic={0.15}
          style={{
            x,
            zIndex: 1,
            backgroundColor: isMobile ? "#111" : "transparent",
          }}
          animate={dragControls}
          onDragEnd={handleDragEnd}
        >
          <div className={`max-w-md relative flex`}>
            {!isCurrentUser && selectedUser && (
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

            <div className="flex-1">
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

              <div
                className={`flex flex-col ${
                  isCurrentUser ? "items-end" : "items-start"
                } max-w-xs gap-1`}
              >
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
                      className={`${styles.alo} ${
                        isCurrentUser ? "bg-[#24233526]" : "bg-[#3a3b3c]"
                      } rounded-xl py-2 cursor-pointer transition-opacity max-w-full`}
                      style={{ marginBottom: "-22px" }}
                      onClick={() => {
                        const repliedMsgId =
                          typeof msg.replyTo === "string"
                            ? msg.replyTo
                            : msg.replyTo &&
                              typeof msg.replyTo === "object" &&
                              "_id" in msg.replyTo
                            ? (msg.replyTo as { _id: string })._id
                            : undefined;
                        if (repliedMsgId) handleReplyClick(repliedMsgId);
                      }}
                    >
                      <ReplyMessageBubble
                        replyTo={msg.replyTo}
                        messages={messages}
                        userId={userId}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-0">
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

                  {msg.message && (
                    <div
                      className={`message-bubble px-4 py-3 break-words ${
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

                  {msg.mediaUrl && (
                    <div
                      className="overflow-hidden max-w-[200px] relative group"
                      style={{
                        backgroundColor: "transparent",
                        borderRadius: isCurrentUser
                          ? msg.message
                            ? msg.replyTo
                              ? "4px 4px 7px 18px"
                              : "4px 4px 7px 18px"
                            : msg.replyTo
                            ? "18px 18px 7px 18px"
                            : "18px 18px 18px 18px"
                          : msg.message
                          ? msg.replyTo
                            ? "4px 4px 18px 7px"
                            : "4px 4px 18px 7px"
                          : msg.replyTo
                          ? "18px 18px 18px 7px"
                          : "18px 18px 18px 18px",
                        marginTop: msg.message
                          ? msg.replyTo
                            ? "-1px"
                            : "-1px"
                          : msg.replyTo
                          ? "0"
                          : "0",
                      }}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: "rgba(0,0,0,0.08)" }}
                      />
                      <div className="transition-transform duration-200 group-hover:scale-[1.03]">
                        {msg.mediaType === "image" ? (
                          <Image
                            src={msg.mediaUrl}
                            alt="Shared image"
                            width={200}
                            height={150}
                            className="object-cover w-full h-auto cursor-pointer"
                            style={{
                              maxHeight: "200px",
                              minHeight: "80px",
                              display: "block",
                              borderRadius: "inherit",
                              background: "transparent",
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
                            className="w-full h-auto cursor-pointer object-cover"
                            style={{
                              maxHeight: "200px",
                              minHeight: "80px",
                              display: "block",
                              borderRadius: "inherit",
                              background: "transparent",
                            }}
                            preload="metadata"
                            onError={() => {
                              console.error(
                                "Failed to load video:",
                                msg.mediaUrl
                              );
                            }}
                          >
                            {" "}
                            <source src={msg.mediaUrl} /> Trình duyệt không hỗ
                            trợ phát video này.{" "}
                          </video>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 px-1 self-start">
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
        </motion.div>
      </div>
    );
  };

  return (
    <div
      className={`flex-1 flex flex-col bg-[#111] ${styles.mainChat} ${
        showMainChat ? styles.showMainChat : ""
      } ${preview ? "w-full h-full" : ""}`}
      style={
        preview
          ? {
              width: "100%",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
            }
          : {}
      }
    >
      <div
        className={`flex justify-between items-center p-4 border-b border-[#222] position-relative bg-[#0f0f0f] ${styles.chatHeader}`}
      >
        {selectedUser ? (
          <>
            <div className="flex items-center">
              <button
                className={styles.backBtn}
                onClick={() => {
                  if (preview) {
                    setShowMainChat(false);
                  } else {
                    setShowMainChat(false);
                    window.history.back();
                  }
                }}
                style={{
                  marginRight: 8,
                  display: preview ? "block" : "none",
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
          {loadingMore && (
            <div className="flex justify-center py-2 mb-4">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          )}

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
            messages.map((msgObject, idx) => (
              <MessageItem
                msg={msgObject}
                index={idx}
                key={generateMessageKey(msgObject, idx)}
              />
            ))
          ) : (
            <div className="flex justify-center items-center h-full">
              <p
                className="text-gray-400 w-full"
                style={{ textAlign: "center" }}
              >
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
