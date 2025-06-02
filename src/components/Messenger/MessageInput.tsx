import { SendHorizontal, Smile, Image as ImageIcon } from "lucide-react";
import styles from "./Messenger.module.scss";
import InputStory from "../Modal/Story/StoryInput";
import ReplyMessageContent from "./ReplyMessage";
import type { User, Message } from "@/types/user.type";

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

  return (
    <div
      className={`border-t border-[#222] p-4 bg-[#111] ${styles.messageInput}`}
    >
      {/* Reply preview below input */}
      {replyTo && (
        <div className="flex items-center mb-2 bg-[#232323] rounded-lg px-3 py-2 relative">
          <div className="flex-1 min-w-0">
            <ReplyMessageContent
              replyTo={replyTo}
              availableUsers={availableUsers}
              messages={messages}
              userId={userId}
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
  );
}
