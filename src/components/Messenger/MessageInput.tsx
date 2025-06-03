import { SendHorizontal, Smile, Image as ImageIcon } from "lucide-react";
import styles from "./Messenger.module.scss";
import InputStory from "../Modal/Story/StoryInput";
import { ReplyMessageDisplayText, ReplyMessageBubble } from "./ReplyMessage";
import type { User, Message } from "@/types/user.type";
import Image from "next/image";

export type MessageInputProps = {
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputStory?: boolean;
  // --- Reply feature ---
  replyTo?: string | null;
  clearReplyTo?: () => void;
  messages?: Message[];
  availableUsers?: User[];
  userId?: string;
  // Thêm các props cho file upload
  file?: File | null;
  setFile?: (f: File | null) => void;
  filePreview?: string | null;
  setFilePreview?: (url: string | null) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
};

export default function MessageInput({
  message,
  setMessage,
  handleSendMessage,
  handleKeyPress,
  inputStory = false,
  replyTo,
  clearReplyTo,
  messages = [],
  availableUsers = [],
  userId = "",
  file,
  setFile,
  filePreview,
  setFilePreview,
  fileInputRef,
}: MessageInputProps) {
  if (inputStory) {
    // Giao diện tối giản cho story: input ở giữa, heart icon, send button
    return (
      <InputStory
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
      />
    );
  }

  // Thêm logic chọn file, preview, và nút gửi file ở đây
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!setFile || !setFilePreview) return;
    const file = e.target.files?.[0] || null;
    setFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  return (
    <div
      className={`border-t border-[#222] p-4 bg-[#111] ${styles.messageInput}`}
    >
      {/* Reply preview below input */}
      {replyTo && (
        <div className="flex items-center mb-2 bg-[#232323] rounded-lg px-3 py-2 relative">
          <div className="flex-1 min-w-0">
            <ReplyMessageDisplayText
              replyTo={replyTo}
              availableUsers={availableUsers}
              messages={messages}
              userId={userId}
              isPreview={true}
              currentMessageSenderId={userId}
            />
            <ReplyMessageBubble
              replyTo={replyTo}
              messages={messages}
              userId={""}
            />
          </div>
          <button
            className="ml-2 text-gray-400 hover:text-red-400 text-xs px-1"
            onClick={clearReplyTo}
            title="Hủy trả lời"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
      {/* Hiển thị preview file nếu có */}
      {filePreview && (
        <div className="mb-2 flex items-center gap-2">
          {file && file.type.startsWith("image/") && (
            <Image
              src={filePreview}
              alt="preview"
              width={96}
              height={96}
              className="max-h-24 rounded"
            />
          )}
          {file && file.type.startsWith("video/") && (
            <video src={filePreview} controls className="max-h-24 rounded" />
          )}
          <button
            className="ml-2 text-gray-400 hover:text-red-400 text-xs px-1"
            onClick={() => {
              if (setFile) setFile(null);
              if (setFilePreview) setFilePreview(null);
              if (fileInputRef && fileInputRef.current)
                fileInputRef.current.value = "";
            }}
            title="Xóa file"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
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
          <button
            className="mr-2 hover:text-gray-200 flex-shrink-0"
            type="button"
            onClick={() =>
              fileInputRef &&
              fileInputRef.current &&
              fileInputRef.current.click()
            }
          >
            <ImageIcon className="h-5 w-5 text-gray-400" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </button>
        </div>
        <button
          className="ml-3 text-gray-400 hover:text-gray-200 flex-shrink-0"
          onClick={handleSendMessage}
        >
          <div className="flex items-center justify-center h-8 w-8">
            {message || file ? (
              <SendHorizontal className="h-5 w-5 text-blue-500" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
