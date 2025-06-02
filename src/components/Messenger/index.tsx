// src/components/Messenger/index.tsx
"use client";

import { useEffect, useState } from "react";
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
}

export default function MessengerComponent({
  ringtoneRef,
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

  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");

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
    }) => {
      // Xử lý realtime replyTo: nếu msg.replyTo là string, tìm trong messages, nếu là object thì map về Message tối thiểu
      let replyToValue: string | null = null;
      if (msg.replyTo) {
        if (typeof msg.replyTo === "string") {
          const found = messages.find((m) => m._id === msg.replyTo);
          replyToValue = found ? found._id : msg.replyTo;
        } else if (typeof msg.replyTo === "object" && msg.replyTo._id) {
          // Nếu object, chỉ lấy _id để truyền xuống ReplyMessageContent, FE sẽ tự resolve object
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
      dispatch(
        fetchMessages({
          userId: selectedUser._id,
          before: undefined,
          replace: true,
        })
      );
    }
  }, [selectedUser, userId, dispatch]);

  const replyTo = useAppSelector((state) => state.messenger.replyTo);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser || !userId) return;
    // Nếu đang reply thì gửi thêm trường replyTo, còn không thì gửi như cũ
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
      />
    </div>
  );
}
