"use client";

import type { Message } from "@/types/user.type";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export type AvailableUser = {
  _id: string;
  username: string;
  profilePicture?: string;
};

// Hàm tiện ích để lấy token từ localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

// Lấy danh sách người dùng có thể nhắn tin
export const getAvailableUsers = async (): Promise<AvailableUser> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  const response = await fetch(`${BASE_URL}/messenger/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể lấy danh sách người dùng");
  }

  return response.json();
};

// Lấy lịch sử tin nhắn với một người dùng cụ thể
export const getMessages = async (
  userId: string,
  limit = 6,
  offset = 0
): Promise<Message[]> => {
  const token = getAuthToken();
  const url = `${BASE_URL}/messenger/messages/${userId}?limit=${limit}&offset=${offset}`;
  console.log("Gọi API:", url);
  console.log("Token:", token);

  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Response lỗi:", errorText);
    throw new Error("Lỗi khi lấy tin nhắn");
  }
  return res.json();
};

// Gửi tin nhắn qua REST API
export const sendMessage = async (
  receiverId: string,
  message: string
): Promise<{ message: Message }> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  const response = await fetch(`${BASE_URL}/messenger/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receiverId,
      message,
    }),
  });

  if (!response.ok) {
    throw new Error("Không thể gửi tin nhắn");
  }

  return response.json();
};

// Đánh dấu tin nhắn đã đọc
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  const response = await fetch(`${BASE_URL}/messenger/markRead/${messageId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể đánh dấu tin nhắn đã đọc");
  }

  return;
};

// Lấy số lượng tin nhắn chưa đọc
export const getUnreadCount = async (
  senderId: string, // id của đối phương (người gửi)
  receiverId: string // id của bạn (người nhận)
): Promise<{ unreadCount: number; message: string }> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  // Gọi endpoint: /messenger/unread-count/:senderId?receiverId=...
  const response = await fetch(
    `${BASE_URL}/messenger/unread-count/${senderId}?receiverId=${receiverId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Không thể lấy số lượng tin nhắn chưa đọc");
  }

  return response.json();
};

// Xóa một tin nhắn
export const deleteMessage = async (messageId: string): Promise<void> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  const response = await fetch(`${BASE_URL}/messenger/message/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể xóa tin nhắn");
  }

  return;
};

// Kiểm tra trạng thái online/offline của người dùng
export const getUserStatus = async (
  userId: string
): Promise<{ userId: string; status: "online" | "offline" }> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  const response = await fetch(`${BASE_URL}/messenger/status/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể kiểm tra trạng thái người dùng");
  }

  const data = await response.json();
  if (!data || !data.userId || !data.status) {
    throw new Error("Ph n h i tr  l i khi kiểm tra trạng thái người dùng");
  }

  return data;
};
