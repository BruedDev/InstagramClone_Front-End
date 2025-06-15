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
import { useNotification } from "@/utils/useNotification";

import SiderBar from "./SiderBar";
import MainChat from "./MainChat";

interface MessengerComponentProps {
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;
  isModal?: boolean;
  preview?: boolean;
  onClose?: () => void;
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
    messages,
    message,
    loading,
    loadingMore,
    hasMore,
    showMainChat,
  } = useAppSelector((state) => state.messenger);
  const { notify } = useNotification();

  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastFetchReplace, setLastFetchReplace] = useState(false);

  // State để kiểm soát việc hiển thị thông báo khi đã đóng modal
  const [isClosed, setIsClosed] = useState(false);

  // Sửa hàm onClose để set isClosed
  const handleClose = () => {
    setIsClosed(true);
    if (onClose) onClose();
  };

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
      mediaUrl?: string;
      mediaType?: "image" | "video" | "file";
      isOwnMessage?: boolean;
    }) => {
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
      // Gửi thông báo nếu là tin nhắn đến và không phải của mình
      if (convertedMsg.senderId !== userId && !isClosed) {
        // Lấy đúng user từ danh sách availableUsers hoặc từ msg.senderId
        let senderName = "Người lạ";
        if (msg.senderId) {
          const foundUser = availableUsers.find((u) => u._id === msg.senderId);
          if (foundUser && foundUser.username) {
            senderName = foundUser.username;
          } else if (
            msg.senderId === selectedUser?._id &&
            selectedUser?.username
          ) {
            senderName = selectedUser.username;
          }
        }
        notify("Tin nhắn mới", {
          body: `Bạn có tin nhắn mới từ ${senderName}`,
          icon: "/instagram.png",
        });
      }
    };

    socketService.onReceiveMessage(handleReceiveMessage);
    return () => {
      socketService.offReceiveMessage(handleReceiveMessage);
    };
  }, [
    selectedUser,
    userId,
    dispatch,
    messages,
    notify,
    availableUsers,
    isClosed,
  ]);

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
    if (selectedUser?._id && userId && messages.length === 0 && hasMore) {
      setLastFetchReplace(true);
      dispatch(
        fetchMessages({
          userId: selectedUser._id,
          before: undefined,
          replace: true,
        })
      );
    }
  }, [selectedUser?._id, userId, dispatch, messages.length, hasMore]);

  const replyTo = useAppSelector((state) => state.messenger.replyTo);

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
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        console.log("[Messenger] Sending media message:", {
          senderId: userId,
          receiverId: selectedUser._id,
          message: message || "",
          tempId: Date.now().toString(),
          replyTo: replyToId,
          media: base64,
          mediaType: file.type.startsWith("image/") ? "image" : "video",
        });
        socketService.emitUploadMediaComplete({
          messageId: Date.now().toString(),
          media: base64,
          mediaType: file.type.startsWith("image/") ? "image" : "video",
        });
        socketService.sendMessage({
          senderId: userId,
          receiverId: selectedUser._id,
          message: message || "",
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
      setLastFetchReplace(false);
      dispatch(
        fetchMessages({
          userId: selectedUser._id,
          before,
          replace: false,
        })
      );
    }
  };

  useEffect(() => {
    return () => {
      dispatch(setSelectedUser(null));
      dispatch(resetMessagesState());
    };
  }, [dispatch]);

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

  const [showMainChatModal, setShowMainChatModal] = useState(false);

  // Reset lại isClosed khi mở lại Messenger modal
  useEffect(() => {
    if (showMainChatModal) {
      setIsClosed(false);
    }
  }, [showMainChatModal]);

  if (isLargeScreen && (isModal || preview)) {
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
            messages={messages}
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
            replace={lastFetchReplace}
          />
        </div>
      );
    }
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
          onClose={handleClose}
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
        messages={messages}
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
        replace={lastFetchReplace}
      />
    </div>
  );
}
