import type { User, Message } from "@/types/user.type";

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
  let displayText = "";
  const originalSenderName = getUserName(originalSenderId);
  if (isPreview) {
    if (originalSenderId === userId) {
      displayText = "Bạn đang trả lời chính mình";
    } else {
      displayText = `Bạn đang trả lời ${originalSenderName}`;
    }
  } else {
    if (replySenderId === userId) {
      if (originalSenderId === userId) {
        displayText = "Bạn đã trả lời chính mình";
      } else {
        displayText = `Bạn đã trả lời ${originalSenderName}`;
      }
    } else {
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
    <p className="text-[12px] text-gray-300 font-medium mb-0.5">
      {displayText}
    </p>
  );
}

// Xuất component chỉ hiển thị message bubble (nội dung tin nhắn gốc)
export function ReplyMessageBubble({
  replyTo,
  messages,
  userId,
}: {
  replyTo: string | ReplyMessageData | null;
  messages: Message[];
  userId: string;
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
      // receiverId không được sử dụng trực tiếp trong logic hiển thị của bubble này,
      // nhưng vẫn giữ lại nếu replyObj cần nó cho các mục đích khác.
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
  // Xác định xem người gửi tin nhắn gốc có phải là người dùng hiện tại không
  const isOriginalSenderCurrentUser = originalMessageSenderId === userId;

  // Nội dung của bubble
  const bubbleContent = (
    <div
      className={"reply-bubble-mess-fb message-bubble-reply"}
      style={{
        // position: "relative",
        background: "#333", // Màu nền ví dụ
        // Cập nhật borderRadius: top-left top-right bottom-right bottom-left
        // Góc trên bo tròn nhiều (18px), góc dưới không phải đuôi bo tròn vừa phải (12px), góc đuôi sắc nét (4px).
        borderRadius: isOriginalSenderCurrentUser
          ? "20px 20px 12px 4px" // Tin nhắn gốc của người dùng hiện tại (đuôi ở bottom-left)
          : "18px 18px 4px 12px", // Tin nhắn gốc của người khác (đuôi ở bottom-right)
      }}
    >
      <p className="text-md text-gray-300 line-clamp-2">
        {replyObj.message || "Tin nhắn"}
      </p>
      {/* CSS cho bubble, giữ nguyên từ các phiên bản trước */}
      <style jsx>{`
        .reply-bubble-mess-fb {
          display: inline-block;
          padding: 12px 14px 12px 12px;
          // margin-bottom: 2px;
          max-width: 320px;
          font-size: 13px;
          transition: background 0.2s;
          word-break: break-word;
        }
      `}</style>
    </div>
  );

  // Logic căn chỉnh bubble (giữ nguyên từ phiên bản trước)
  // Nếu tin nhắn gốc được trích dẫn KHÔNG PHẢI của người dùng hiện tại (tức là của "người khác"),
  // thì bọc bubble này trong một div để căn chỉnh sang phải (trong ngữ cảnh của khối tin nhắn trả lời của người dùng hiện tại).
  if (!isOriginalSenderCurrentUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {bubbleContent}
      </div>
    );
  } else {
    // Nếu tin nhắn gốc là của người dùng hiện tại,
    // trả về bubbleContent trực tiếp (sẽ hiển thị bên trái trong ngữ cảnh khối tin nhắn trả lời của người khác).
    return bubbleContent;
  }
}
