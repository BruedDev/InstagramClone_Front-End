import type { User, Message } from "@/types/user.type";

interface ReplyMessageData {
  _id: string;
  message: string;
  senderId: string | { _id: string; username?: string; fullName?: string };
  [key: string]: unknown;
}

export default function ReplyMessageContent({
  replyTo,
  availableUsers,
  messages,
  userId,
  isPreview = false,
  currentMessageSenderId, // Thêm prop này để biết ai đang gửi tin nhắn reply hiện tại
}: {
  replyTo: string | ReplyMessageData | null;
  availableUsers: User[];
  messages: Message[];
  userId: string;
  isCurrentUser?: boolean;
  isPreview?: boolean;
  currentMessageSenderId?: string; // ID của người gửi tin nhắn reply hiện tại
}) {
  if (!replyTo) return null;

  let replyObj: ReplyMessageData | null = null;
  if (typeof replyTo === "string") {
    const foundMsg = messages.find((msg) => msg._id === replyTo);
    if (!foundMsg) {
      return (
        <>
          <p className="text-gray-300 font-medium text-[10px] mb-0.5">
            Tin nhắn gốc
          </p>
          <p className="text-xs text-gray-200">Tin nhắn không tồn tại</p>
        </>
      );
    }
    replyObj = {
      _id: foundMsg._id,
      message:
        typeof foundMsg.message === "string"
          ? foundMsg.message
          : typeof foundMsg.content === "string"
          ? foundMsg.content
          : "",
      senderId:
        typeof foundMsg.senderId === "string" ||
        typeof foundMsg.senderId === "object"
          ? foundMsg.senderId
          : "",
      receiverId:
        typeof foundMsg.receiverId === "string" ||
        typeof foundMsg.receiverId === "object"
          ? foundMsg.receiverId
          : "",
    };
  } else {
    replyObj = replyTo as ReplyMessageData;
  }

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

  // senderId của tin nhắn GỐC (tin nhắn được reply)
  const originalSenderId = getId(replyObj.senderId);

  // ID của người đang gửi tin nhắn reply hiện tại
  const replySenderId = currentMessageSenderId || userId;

  // Lấy thông tin user names
  const getUserName = (id: string): string => {
    const found = availableUsers.find((user) => user._id === id);
    return found
      ? found.username || found.fullName || "Unknown User"
      : "Unknown User";
  };

  // Logic hiển thị text
  let displayText = "";
  const originalSenderName = getUserName(originalSenderId);

  if (isPreview) {
    // Khi đang preview trong input
    if (originalSenderId === userId) {
      // Tin nhắn gốc là của mình
      displayText = "Bạn đang trả lời chính mình";
    } else {
      // Tin nhắn gốc là của người khác
      displayText = `Bạn đang trả lời ${originalSenderName}`;
    }
  } else {
    // Khi hiển thị trong chat
    if (replySenderId === userId) {
      // Mình là người gửi tin nhắn reply
      if (originalSenderId === userId) {
        displayText = "Bạn đã trả lời chính mình";
      } else {
        displayText = `Bạn đã trả lời ${originalSenderName}`;
      }
    } else {
      // Người khác là người gửi tin nhắn reply
      const replySenderName = getUserName(replySenderId);
      if (originalSenderId === userId) {
        displayText = `${replySenderName} đã trả lời bạn`;
      } else if (originalSenderId === replySenderId) {
        displayText = `${replySenderName} đã trả lời chính mình`;
      } else {
        displayText = `${replySenderName} đã trả lời ${originalSenderName}`;
      }
    }
  }

  return (
    <>
      <p className="text-[10px] text-gray-300 font-medium mb-0.5">
        {displayText}
      </p>
      <p className="text-xs text-gray-200 line-clamp-2">
        {replyObj.message || "Tin nhắn"}
      </p>
    </>
  );
}
