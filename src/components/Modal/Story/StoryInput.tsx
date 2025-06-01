import { SendHorizontal } from "lucide-react";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { useState } from "react";
import styles from "@/components/Modal/Story/StoryModal.module.scss";

export default function InputStory({
  message,
  setMessage,
  handleSendMessage,
  handleKeyPress,
}: {
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [isLiked, setIsLiked] = useState(false);

  const handleHeartClick = () => {
    setIsLiked(!isLiked);
  };

  return (
    <div className="flex items-center w-full bg-transparent gap-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Gửi tin nhắn..."
        className={`flex-1 bg-[#1a1a1a] rounded-full px-4 py-2 focus:outline-none border border-[#333] text-white placeholder-gray-500 ${styles.input}`}
      />
      {isLiked ? (
        <GoHeartFill
          className="h-6 w-6 text-red-500 cursor-pointer flex-shrink-0 transition-colors"
          onClick={handleHeartClick}
        />
      ) : (
        <GoHeart
          className="h-6 w-6 text-white cursor-pointer flex-shrink-0 transition-colors"
          onClick={handleHeartClick}
        />
      )}
      <button
        className="text-gray-400 hover:text-gray-200 flex-shrink-0"
        onClick={handleSendMessage}
      >
        <div className="flex items-center justify-center h-8 w-8">
          {message ? (
            <SendHorizontal className="h-5 w-5 text-blue-500" />
          ) : (
            <SendHorizontal
              className="h-5 w-5 text-white"
              style={{ cursor: "pointer" }}
            />
          )}
        </div>
      </button>
    </div>
  );
}
