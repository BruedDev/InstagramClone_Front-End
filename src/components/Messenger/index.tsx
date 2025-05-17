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
    if (userId) {
      socketService.initSocket();
      socketService.registerUser(userId);
    }
    return () => {
      socketService.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    const handleReceiveMessage = (msg: {
      senderId: string;
      message: string;
      timestamp: string;
      receiverId?: string;
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
        fetchMessages({ userId: selectedUser._id, offset: 0, replace: true })
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

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && selectedUser) {
      dispatch(
        fetchMessages({
          userId: selectedUser._id,
          // offset: useAppSelector((state) => state.messenger.offset),
          replace: false,
        })
      );
    }
  };

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
