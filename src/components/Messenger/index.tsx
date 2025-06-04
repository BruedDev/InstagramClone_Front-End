// src/components/Messenger/index.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Message } from "@/types/user.type";
import styles from "./Messenger.module.scss";
import { socketService } from "@/server/socket";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAvailableUsers,
  fetchMessages,
  setSelectedUser,
  setMessage,
  addMessage,
  setShowMainChat,
  resetMessagesState,
} from "@/store/messengerSlice";

import SiderBar from "./SiderBar";
import MainChat from "./MainChat";

interface MessengerComponentProps {
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;
  isModal?: boolean;
  preview?: boolean; // Thêm prop preview để truyền xuống SiderBar nếu cần
  onClose?: () => void; // Thêm prop onClose
}

export default function MessengerComponent({
  ringtoneRef,
  isModal = false,
  preview = false,
  onClose,
}: MessengerComponentProps) {
  const dispatch = useAppDispatch();
  const {
    availableUsers,
    selectedUser,
    messagesByUser,
    messages, // Giữ lại để tránh lỗi, sẽ loại bỏ sau khi refactor xong
    message,
    loading,
    loadingMore,
    hasMore,
    showMainChat,
  } = useAppSelector((state) => state.messenger);

  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleReceiveMessage = (msg: {
      _id?: string;
      senderId: string;
      receiverId?: string;
      message: string;
      createdAt?: string;
      updatedAt?: string;
      isRead?: boolean;
      timestamp?: string;
      replyTo?:
        | string
        | null
        | {
            _id: string;
            senderId?: { _id: string } | string;
            receiverId?: { _id: string } | string;
            message?: string;
            createdAt?: string;
            updatedAt?: string;
            isRead?: boolean;
            replyTo?: string | null;
          };
      // Thêm các trường media
      mediaUrl?: string;
      mediaType?: "image" | "video" | "file";
      isOwnMessage?: boolean;
    }) => {
      // Xử lý realtime replyTo như cũ...
      let replyToValue: string | null = null;
      if (msg.replyTo) {
        if (typeof msg.replyTo === "string") {
          const found = messages.find((m) => m._id === msg.replyTo);
          replyToValue = found ? found._id : msg.replyTo;
        } else if (typeof msg.replyTo === "object" && msg.replyTo._id) {
          replyToValue = msg.replyTo._id;
        }
      }

      const id = msg._id || msg.timestamp || "";
      const createdAt = msg.createdAt || msg.timestamp || "";
      const updatedAt = msg.updatedAt || msg.timestamp || "";

      const convertedMsg: Message = {
        id,
        _id: id,
        senderId: msg.senderId,
        receiverId: msg.receiverId ?? "",
        content: msg.message,
        createdAt,
        updatedAt,
        read: msg.isRead ?? false,
        message: msg.message,
        replyTo: replyToValue,
        // Thêm các trường media
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        isOwnMessage: msg.isOwnMessage,
      };

      if (
        selectedUser &&
        ((convertedMsg.senderId === selectedUser._id &&
          convertedMsg.receiverId === userId) ||
          (convertedMsg.senderId === userId &&
            convertedMsg.receiverId === selectedUser._id))
      ) {
        dispatch(addMessage(convertedMsg));
      }
    };

    socketService.onReceiveMessage(handleReceiveMessage);
    return () => {
      socketService.offReceiveMessage(handleReceiveMessage);
    };
  }, [selectedUser, userId, dispatch, messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("id");
      if (storedId) {
        setUserId(storedId);
      }
    }

    dispatch(fetchAvailableUsers())
      .unwrap()
      .then((users) => {
        // Auto-select user from URL if exists
        const selectedId = searchParams.get("id");
        if (selectedId) {
          const foundUser = users.find((user) => user._id === selectedId);
          if (foundUser) {
            dispatch(setSelectedUser(foundUser));
          }
        }
      });
  }, [dispatch, searchParams]);

  useEffect(() => {
    if (selectedUser && userId) {
      // Nếu đã có messages cho user này thì không fetch lại
      if (
        !messagesByUser[selectedUser._id] ||
        messagesByUser[selectedUser._id].length === 0
      ) {
        dispatch(
          fetchMessages({
            userId: selectedUser._id,
            before: undefined,
            replace: true,
          })
        );
      }
    }
  }, [selectedUser, userId, dispatch, messagesByUser]);

  const replyTo = useAppSelector((state) => state.messenger.replyTo);

  // Lắng nghe updateMessageMedia từ socket để cập nhật mediaUrl cho message
  useEffect(() => {
    const handleUpdateMessageMedia = (data: {
      messageId: string;
      mediaUrl: string;
    }) => {
      console.log("[Messenger] updateMessageMedia received:", data);
      dispatch({
        type: "messenger/updateMessageMedia",
        payload: { messageId: data.messageId, mediaUrl: data.mediaUrl },
      });
    };
    socketService.onUpdateMessageMedia(handleUpdateMessageMedia);
    return () => {
      socketService.offUpdateMessageMedia(handleUpdateMessageMedia);
    };
  }, [dispatch]);

  const handleSendMessage = async () => {
    if ((!message.trim() && !file) || !selectedUser || !userId) return;
    let replyToId: string | undefined = undefined;
    if (replyTo) {
      if (typeof replyTo === "string") {
        replyToId = replyTo;
      } else if (
        typeof replyTo === "object" &&
        replyTo !== null &&
        "_id" in replyTo
      ) {
        replyToId = (replyTo as { _id: string })._id;
      }
    }
    if (file) {
      // Đọc file thành base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        console.log("[Messenger] Sending media message:", {
          senderId: userId,
          receiverId: selectedUser._id,
          message: message || "", // Nếu chỉ gửi media thì message là rỗng
          tempId: Date.now().toString(),
          replyTo: replyToId,
          media: base64,
          mediaType: file.type.startsWith("image/") ? "image" : "video",
        });
        socketService.emitUploadMediaComplete({
          messageId: Date.now().toString(), // Tạo tạm, BE sẽ update lại
          media: base64,
          mediaType: file.type.startsWith("image/") ? "image" : "video",
        });
        socketService.sendMessage({
          senderId: userId,
          receiverId: selectedUser._id,
          message: message || "", // Nếu chỉ gửi media thì message là rỗng
          tempId: Date.now().toString(),
          replyTo: replyToId,
          media: base64,
          mediaType: file.type.startsWith("image/") ? "image" : "video",
        });
        setFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    } else {
      if (replyToId) {
        socketService.sendMessage({
          senderId: userId,
          receiverId: selectedUser._id,
          message,
          replyTo: replyToId,
        });
      } else {
        socketService.sendMessage({
          senderId: userId,
          receiverId: selectedUser._id,
          message,
        });
      }
    }
    dispatch(setMessage(""));
    dispatch({ type: "messenger/clearReplyTo" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const before = useAppSelector((state) => state.messenger.before);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && selectedUser && before) {
      dispatch(
        fetchMessages({
          userId: selectedUser._id,
          before,
          replace: false,
        })
      );
    }
  };

  // Reset selectedUser và messages state khi rời khỏi trang Messages
  useEffect(() => {
    return () => {
      dispatch(setSelectedUser(null));
      dispatch(resetMessagesState());
    };
  }, [dispatch]);

  // State kiểm tra màn hình lớn hơn 768px
  const [isLargeScreen, setIsLargeScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth > 768 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth > 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Nếu là modal hoặc preview thì chỉ render SiderBar hoặc MainChat theo state riêng, chỉ áp dụng khi màn hình lớn hơn 768px
  const [showMainChatModal, setShowMainChatModal] = useState(false);

  if (isLargeScreen && (isModal || preview)) {
    // Nếu đã chọn user và showMainChatModal=true thì render MainChat, ngược lại render SiderBar
    if (selectedUser && showMainChatModal) {
      return (
        <div
          className={`flex h-full bg-[#0a0a0a] text-gray-200 ${styles.container} ${styles.modalContainer}`}
          style={{
            width: "100%",
            height: "100%",
            position: "static",
            padding: 0,
            margin: 0,
            left: "unset",
            top: "unset",
            transform: "none",
          }}
        >
          <MainChat
            selectedUser={selectedUser}
            messages={messagesByUser[selectedUser._id] || []}
            message={message}
            setMessage={(msg) => dispatch(setMessage(msg))}
            handleSendMessage={handleSendMessage}
            handleKeyPress={handleKeyPress}
            loading={loading}
            userId={userId}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            ringtoneRef={ringtoneRef}
            availableUsers={availableUsers}
            showMainChat={showMainChatModal}
            setShowMainChat={setShowMainChatModal}
            file={file}
            setFile={setFile}
            filePreview={filePreview}
            setFilePreview={setFilePreview}
            fileInputRef={fileInputRef}
            preview={true}
          />
        </div>
      );
    }
    // Chưa chọn user hoặc showMainChatModal=false thì chỉ render SiderBar
    return (
      <div
        className={`flex h-full bg-[#0a0a0a] text-gray-200 ${styles.container} ${styles.modalContainer}`}
        style={{
          width: "100%",
          height: "100%",
          position: "static",
          padding: 0,
          margin: 0,
          left: "unset",
          top: "unset",
          transform: "none",
        }}
      >
        <SiderBar
          availableUsers={availableUsers}
          selectedUser={selectedUser}
          setSelectedUser={(user) => {
            dispatch(setSelectedUser(user));
            setShowMainChatModal(true);
          }}
          userId={userId}
          setShowMainChat={setShowMainChatModal}
          preview={true}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen bg-[#0a0a0a] text-gray-200 ${styles.container}`}
    >
      <SiderBar
        availableUsers={availableUsers}
        selectedUser={selectedUser}
        setSelectedUser={(user) => dispatch(setSelectedUser(user))}
        userId={userId}
        setShowMainChat={(show) => dispatch(setShowMainChat(show))}
      />
      <MainChat
        selectedUser={selectedUser}
        messages={selectedUser ? messagesByUser[selectedUser._id] || [] : []}
        message={message}
        setMessage={(msg) => dispatch(setMessage(msg))}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
        loading={loading}
        userId={userId}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
        ringtoneRef={ringtoneRef}
        availableUsers={availableUsers}
        showMainChat={showMainChat}
        setShowMainChat={(show) => dispatch(setShowMainChat(show))}
        file={file}
        setFile={setFile}
        filePreview={filePreview}
        setFilePreview={setFilePreview}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}
