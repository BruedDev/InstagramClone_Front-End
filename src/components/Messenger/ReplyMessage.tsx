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
}: // isCurrentUser,
{
  replyTo: string | ReplyMessageData | null;
  availableUsers: User[];
  messages: Message[];
  userId: string;
  isCurrentUser?: boolean;
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

  const senderId = replyObj.senderId;
  const receiverId =
    typeof replyObj !== "object"
      ? ""
      : "receiverId" in replyObj
      ? (
          replyObj as {
            receiverId?:
              | string
              | { _id: string; username?: string; fullName?: string };
          }
        ).receiverId || ""
      : "";
  const isCurrentUserSender = getId(senderId) === userId;
  const displayId = isCurrentUserSender ? receiverId : senderId;
  let senderName = "Unknown User";
  let receiverName = "Unknown User";

  if (typeof displayId === "object" && displayId !== null) {
    if (displayId.username) {
      senderName = displayId.username;
    } else if (displayId._id) {
      const found = availableUsers.find((user) => user._id === displayId._id);
      if (found) senderName = found.username || found.fullName || senderName;
    } else {
      senderName = JSON.stringify(displayId);
    }
  } else if (typeof displayId === "string") {
    const found = availableUsers.find((user) => user._id === displayId);
    if (found) senderName = found.username || found.fullName || senderName;
  }
  if (
    senderName === "Unknown User" &&
    typeof displayId === "object" &&
    displayId !== null &&
    displayId.fullName
  ) {
    senderName = displayId.fullName;
  }

  if (typeof receiverId === "object" && receiverId !== null) {
    if (receiverId.username) {
      receiverName = receiverId.username;
    } else if (receiverId._id) {
      const found = availableUsers.find((user) => user._id === receiverId._id);
      if (found)
        receiverName = found.username || found.fullName || receiverName;
    } else {
      receiverName = JSON.stringify(receiverId);
    }
  } else if (typeof receiverId === "string") {
    const found = availableUsers.find((user) => user._id === receiverId);
    if (found) receiverName = found.username || found.fullName || receiverName;
  }
  if (
    receiverName === "Unknown User" &&
    typeof receiverId === "object" &&
    receiverId !== null &&
    receiverId.fullName
  ) {
    receiverName = receiverId.fullName;
  }

  let currentUserId = userId;
  if (!currentUserId && typeof window !== "undefined") {
    currentUserId = localStorage.getItem("userId") || "";
  }
  const isCurrentUserReceiver = getId(receiverId) === currentUserId;

  return (
    <>
      <p className="text-[10px] text-gray-300 font-medium mb-0.5">
        {isCurrentUserReceiver
          ? `Bạn đã trả lời ${senderName}`
          : `${receiverName || senderName} đã trả lời bạn`}
      </p>

      <p className="text-xs text-gray-200 line-clamp-2">
        {replyObj.message || "Tin nhắn"}
      </p>
    </>
  );
}
