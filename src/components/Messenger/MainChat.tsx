import Image from "next/image";
import {
  SendHorizontal,
  Smile,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import styles from "./Messenger.module.scss";
import type { User, Message } from "@/types/user.type";
import { useEffect, useRef, useState } from "react";
import Call from "./call";
import { useTime } from "@/app/hooks/useTime";

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
  const [isUserScrollUp, setIsUserScrollUp] = useState(false);
  const [shouldMaintainScrollPosition, setShouldMaintainScrollPosition] =
    useState(false);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(0);
  const { formatTime } = useTime();

  // Xử lý cuộn và load thêm tin nhắn
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;

    // Nếu cuộn lên đầu và còn tin nhắn để load
    if (scrollTop === 0 && hasMore && !loadingMore) {
      // Lưu lại chiều cao hiện tại để sau này điều chỉnh vị trí cuộn
      setPreviousScrollHeight(scrollHeight);
      setShouldMaintainScrollPosition(true);
      onLoadMore();
    }

    // Xác định xem người dùng có đang cuộn lên hay không
    if (scrollHeight - scrollTop - clientHeight > 50) {
      setIsUserScrollUp(true);
    } else {
      setIsUserScrollUp(false);
    }
  };

  // Điều chỉnh vị trí cuộn sau khi tin nhắn mới được tải
  useEffect(() => {
    if (
      shouldMaintainScrollPosition &&
      messagesContainerRef.current &&
      !loadingMore
    ) {
      const { scrollHeight } = messagesContainerRef.current;
      const newPosition = scrollHeight - previousScrollHeight;

      // Đặt vị trí cuộn để duy trì vị trí tương đối sau khi load thêm tin nhắn
      messagesContainerRef.current.scrollTop =
        newPosition > 0 ? newPosition : 0;

      // Reset các trạng thái
      setShouldMaintainScrollPosition(false);
    }
  }, [
    loadingMore,
    shouldMaintainScrollPosition,
    previousScrollHeight,
    messages,
  ]);

  // Cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    if (!isUserScrollUp && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedUser, loading, isUserScrollUp]);

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
              {/* Nút back chỉ hiện trên mobile */}
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
              <style jsx>{`
                @media (max-width: 622px) {
                  .${styles.backBtn} {
                    display: block !important;
                  }
                }
              `}</style>
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3 relative">
                {selectedUser.profilePicture ? (
                  <Image
                    src={selectedUser.profilePicture}
                    alt={selectedUser.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{selectedUser.username}</p>
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
                <p className="text-xs text-gray-400">Active 20 min ago</p>
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
        >
          {hasMore && (
            <div className="flex justify-center mb-2">
              {loadingMore && (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 text-gray-400"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                </span>
              )}
            </div>
          )}
          {loading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <svg
                className="animate-spin h-6 w-6 text-gray-400"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg, index) => {
              const isCurrentUser = msg.senderId === userId;
              return (
                <div
                  key={msg._id || index}
                  className={`flex mb-4 ${isCurrentUser ? "justify-end" : ""}`}
                >
                  {!isCurrentUser && (
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2 relative">
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
                        <button className="mr-2 text-gray-500 hover:text-gray-300">
                          <Smile className="h-4 w-4" />
                        </button>
                      )}
                      <div
                        className={`${
                          isCurrentUser ? "bg-blue-600" : "bg-[#222]"
                        } rounded-lg p-3`}
                      >
                        <p>{msg.message}</p>
                      </div>
                      {!isCurrentUser && (
                        <button className="ml-2 text-gray-500 hover:text-gray-300">
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
            <Smile className="h-6 w-6 mr-3 text-gray-400 cursor-pointer hover:text-gray-200" />
            <div className="flex-1 bg-[#1a1a1a] rounded-full border border-[#222] flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message..."
                className="flex-1 bg-transparent px-4 py-2 focus:outline-none"
              />
              <button className="mr-2 hover:text-gray-200">
                <ImageIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <button
              className="ml-3 text-gray-400 hover:text-gray-200"
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
