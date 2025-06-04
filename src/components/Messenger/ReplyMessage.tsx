import type { User, Message } from "@/types/user.type";
import { MdOutlineReply } from "react-icons/md";

interface ReplyMessageData {
  _id: string;
  message: string;
  senderId: string | { _id: string; username?: string; fullName?: string };
  [key: string]: unknown;
}

export function ReplyMessageDisplayText({
  replyTo,
  availableUsers,
  messages,
  userId,
  isPreview = false,
  currentMessageSenderId,
}: {
  replyTo: string | ReplyMessageData | null;
  availableUsers: User[];
  messages: Message[];
  userId: string;
  isPreview?: boolean;
  currentMessageSenderId?: string;
}) {
  if (!replyTo) return null;
  let replyObj: ReplyMessageData | null = null;
  if (typeof replyTo === "string") {
    const foundMsg = messages.find((msg) => msg._id === replyTo);
    if (!foundMsg) {
      return (
        <p className="text-gray-300 font-medium text-[10px] mb-0.5">
          Tin nhắn gốc
        </p>
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
  const originalSenderId = getId(replyObj.senderId);
  const replySenderId = currentMessageSenderId || userId;
  const getUserName = (id: string): string => {
    const found = availableUsers.find((user) => user._id === id);
    return found
      ? found.username || found.fullName || "Unknown User"
      : "Unknown User";
  };
  let displayText: React.ReactNode = "";
  const originalSenderName = getUserName(originalSenderId);
  if (isPreview) {
    if (originalSenderId === userId) {
      displayText = "Bạn đang trả lời chính mình";
    } else {
      displayText = (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
          <MdOutlineReply style={{ marginRight: 4 }} size={24} />
          Bạn đang trả lời {originalSenderName}
        </span>
      );
    }
  } else {
    if (replySenderId === userId) {
      if (originalSenderId === userId) {
        displayText = (
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
          >
            <MdOutlineReply style={{ marginRight: 4 }} size={20} />
            Bạn đang trả lời chính mình
          </span>
        );
      } else {
        displayText = (
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
          >
            <MdOutlineReply style={{ marginRight: 4 }} size={20} />
            Bạn đã trả lời {originalSenderName}
          </span>
        );
      }
    } else {
      const replySenderName = getUserName(replySenderId);
      if (originalSenderId === userId) {
        displayText = (
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
          >
            <MdOutlineReply style={{ marginRight: 4 }} size={20} />
            {replySenderName} đã trả lời bạn
          </span>
        );
      } else if (originalSenderId === replySenderId) {
        displayText = (
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
          >
            <MdOutlineReply style={{ marginRight: 4 }} size={20} />
            {replySenderName} đã trả lời chính mình
          </span>
        );
      } else {
        displayText = (
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <MdOutlineReply style={{ marginRight: 4 }} />
            {replySenderName} đã trả lời ${originalSenderName}
          </span>
        );
      }
    }
  }
  return (
    <p className="text-[12px] text-gray-300 font-medium mb-2">{displayText}</p>
  );
}

// Xuất component chỉ hiển thị message bubble (nội dung tin nhắn gốc)
export function ReplyMessageBubble({
  replyTo,
  messages,
  userId,
  isPreview = false,
  sender, // Người gửi tin nhắn reply hiện tại
}: {
  replyTo: string | ReplyMessageData | null;
  messages: Message[];
  userId: string;
  isPreview?: boolean;
  sender?: string; // Người gửi tin nhắn reply
  receiver?: string; // Người nhận tin nhắn reply
}) {
  if (!replyTo) return null;
  let replyObj: ReplyMessageData | null = null;
  if (typeof replyTo === "string") {
    const foundMsg = messages.find((msg) => msg._id === replyTo);
    if (!foundMsg) {
      return <p className="text-xs text-gray-200">Tin nhắn không tồn tại</p>;
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

  const originalMessageSenderId = getId(replyObj.senderId);
  const replySenderId = sender || userId; // Sử dụng sender thay vì currentMessageSenderId

  // Logic căn chỉnh dựa trên người gửi tin nhắn reply (không phải tin nhắn gốc)
  const isReplySenderCurrentUser = replySenderId === userId;

  // Logic xác định borderRadius dựa trên góc nhìn của người xem
  // Nếu đang xem từ góc độ của người gửi tin nhắn reply
  const getBorderRadius = () => {
    if (isReplySenderCurrentUser) {
      return originalMessageSenderId === userId
        ? "20px 20px 4px 12px" // Tin nhắn gốc của user hiện tại
        : "18px 18px 12px 4px"; // Tin nhắn gốc của người khác
    } else {
      return originalMessageSenderId === userId
        ? "18px 18px 12px 4px" // Tin nhắn gốc của user hiện tại (nhìn từ góc độ đối phương)
        : "20px 20px 4px 12px"; // Tin nhắn gốc của đối phương (nhìn từ góc độ đối phương)
    }
  };

  // Nội dung của bubble với borderRadius động
  const bubbleContent = (
    <div
      className={"reply-bubble-mess-fb message-bubble-reply"}
      style={{
        background: "#333",
        borderRadius: getBorderRadius(),
      }}
    >
      <p className="text-md text-gray-300 line-clamp-2">
        {replyObj.message || "Tin nhắn"}
      </p>
      <style jsx>{`
        .reply-bubble-mess-fb {
          display: inline-block;
          padding: 12px 14px 12px 12px;
          max-width: 320px;
          font-size: 13px;
          transition: background 0.2s;
          word-break: break-word;
        }
      `}</style>
    </div>
  );

  // Logic căn chỉnh
  if (isPreview) {
    // Lúc preview: luôn luôn trả về bubble trực tiếp (nằm bên trái)
    return bubbleContent;
  } else {
    // Lúc hiển thị thực: căn chỉnh dựa trên người gửi tin nhắn reply
    if (isReplySenderCurrentUser) {
      // Tin nhắn reply của người dùng hiện tại -> căn phải (tin nhắn của user ở bên phải)
      return (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {bubbleContent}
        </div>
      );
    } else {
      // Tin nhắn reply của người khác -> căn trái (tin nhắn của người khác ở bên trái)
      return (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          {bubbleContent}
        </div>
      );
    }
  }
}
