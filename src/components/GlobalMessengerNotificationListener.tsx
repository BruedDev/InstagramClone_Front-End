"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/utils/useNotification";
import { useAppSelector } from "@/store/hooks";
import { socketService } from "@/server/socket";

type Message = {
  senderId: string | { _id: string };
  author?: { username?: string };
  sender?: { username?: string };
  senderName?: string;
  // Add other properties as needed
};

export default function GlobalMessengerNotificationListener() {
  const { notify } = useNotification();
  const router = useRouter();
  const availableUsers = useAppSelector(
    (state) => state.messenger.availableUsers
  );
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;

  useEffect(() => {
    if (!userId) return;

    const handleReceiveMessage = (msg: Message) => {
      // Chỉ thông báo nếu là tin nhắn đến
      if (msg.senderId !== userId) {
        let senderName = "Người lạ";
        let senderId = "";

        // Lấy senderId
        if (typeof msg.senderId === "object") {
          senderId = msg.senderId._id;
        } else {
          senderId = msg.senderId;
        }

        // Lấy senderName
        if (msg.author && msg.author.username) {
          senderName = msg.author.username;
        } else if (msg.sender && msg.sender.username) {
          senderName = msg.sender.username;
        } else if (msg.senderName) {
          senderName = msg.senderName;
        } else if (senderId) {
          const foundUser = availableUsers.find((u) => u._id === senderId);
          if (foundUser && foundUser.username) {
            senderName = foundUser.username;
          }
        }

        notify("Tin nhắn mới", {
          body: `Bạn có tin nhắn mới từ ${senderName}`,
          icon: "/instagram.png",
          onClick: () => {
            // Chuyển hướng đến trang messages với id của sender
            router.push(`/messages?id=${senderId}`);
          },
        });
      }
    };

    const handleCallIncoming = (data: {
      from: string;
      callType?: string;
      callerName?: string;
    }) => {
      let senderName = "Người lạ";
      if (data.callerName) {
        senderName = data.callerName;
      } else if (data.from) {
        const foundUser = availableUsers.find((u) => u._id === data.from);
        if (foundUser && foundUser.username) {
          senderName = foundUser.username;
        }
      }

      let callTypeText = "cuộc gọi";
      if (data.callType === "video") callTypeText = "cuộc gọi video";
      else if (data.callType === "audio") callTypeText = "cuộc gọi thoại";

      notify("Cuộc gọi mới", {
        body: `Bạn có ${callTypeText} đến từ ${senderName}`,
        icon: "/instagram.png",
        requireInteraction: true,
        onClick: () => {
          // Có thể chuyển hướng đến trang call hoặc messages
          router.push(`/messages?id=${data.from}`);
        },
      });
    };

    socketService.onReceiveMessage(handleReceiveMessage);

    const currentSocket = socketService.getSocket
      ? socketService.getSocket()
      : null;
    if (currentSocket) {
      currentSocket.on("incomingCall", handleCallIncoming);
    }
    if (socketService.onCallIncoming) {
      socketService.onCallIncoming(handleCallIncoming);
    }

    return () => {
      socketService.offReceiveMessage(handleReceiveMessage);
      if (currentSocket) {
        currentSocket.off("incomingCall", handleCallIncoming);
      }
      if (socketService.offCallListeners) {
        socketService.offCallListeners();
      }
    };
  }, [availableUsers, notify, userId, router]);

  return null;
}
