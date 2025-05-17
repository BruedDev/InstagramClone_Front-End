"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Message } from "@/types/user.type";
import styles from "./Messenger.module.scss";
import { getAvailableUsers, getMessages } from "@/server/messenger";
import { socketService } from "@/server/socket";

import SiderBar from "./SiderBar";
import MainChat from "./MainChat";

const PAGE_SIZE = 6;

interface MessengerComponentProps {
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;
}

export default function MessengerComponent({
  ringtoneRef,
}: MessengerComponentProps) {
  const [message, setMessage] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showMainChat, setShowMainChat] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
        setMessages((prev) => [...prev, convertedMsg]);
      }
    };

    socketService.onReceiveMessage(handleReceiveMessage);
    return () => {
      socketService.offReceiveMessage(handleReceiveMessage);
    };
  }, [selectedUser, userId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("id");
      if (storedId) {
        setUserId(storedId);
      }
    }

    const fetchAvailableUsers = async () => {
      try {
        const response = await getAvailableUsers();
        const auThor: User[] = Array.isArray(response)
          ? response
          : Array.isArray(response) && Array.isArray(response[0])
          ? (response[0] as User[])
          : [];
        setAvailableUsers(auThor);
      } catch {
        setAvailableUsers([]);
      }
    };

    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    setMessages([]);
    setOffset(0);
    setHasMore(true);
    if (selectedUser && userId) {
      fetchMessages(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, userId]);

  const fetchMessages = useCallback(
    async (currentOffset = 0, replace = false) => {
      if (!selectedUser || !userId) return;
      if (replace) setLoading(true);
      else setLoadingMore(true);
      try {
        const newMessages = await getMessages(
          selectedUser._id,
          PAGE_SIZE,
          currentOffset
        );
        if (replace) {
          setMessages(newMessages);
        } else {
          setMessages((prev) => [...newMessages, ...prev]);
        }
        setOffset(currentOffset + newMessages.length);
        setHasMore(newMessages.length === PAGE_SIZE);
      } catch (error) {
        console.error("Lỗi xảy ra:", error);
        if (replace) setMessages([]);
      } finally {
        if (replace) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [selectedUser, userId]
  );

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser || !userId) return;
    socketService.sendMessage({
      senderId: userId,
      receiverId: selectedUser._id,
      message,
    });
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMessages(offset, false);
    }
  };

  return (
    <div
      className={`flex h-screen bg-[#0a0a0a] text-gray-200 ${styles.container}`}
    >
      <SiderBar
        availableUsers={availableUsers}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        userId={userId}
        setShowMainChat={setShowMainChat}
      />
      <MainChat
        selectedUser={selectedUser}
        messages={messages}
        message={message}
        setMessage={setMessage}
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
        setShowMainChat={setShowMainChat}
      />
    </div>
  );
}
