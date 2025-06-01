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
      senderId: string;
      message: string;
      timestamp: string;
      receiverId?: string;
      replyTo?: string | null;
    }) => {
      const convertedMsg: Message = {
        id: msg.timestamp,
        _id: msg.timestamp,
        senderId: msg.senderId,
        receiverId: msg.receiverId ?? "",
        content: msg.message,
        createdAt: msg.timestamp,
        updatedAt: msg.timestamp,
        read: false,
        message: msg.message,
        replyTo: typeof msg.replyTo === "string" ? msg.replyTo : null,
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

    // ✅ Only setup message listener, don't reinitialize socket
    socketService.onReceiveMessage(handleReceiveMessage);
    return () => {
      socketService.offReceiveMessage(handleReceiveMessage);
    };
  }, [selectedUser, userId, dispatch]);

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

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser || !userId) return;
    socketService.sendMessage({
      senderId: userId,
      receiverId: selectedUser._id,
      message,
    });
    dispatch(setMessage(""));
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
