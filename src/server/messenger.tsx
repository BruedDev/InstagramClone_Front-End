// server/services/messenger.ts (hoặc tên file service của bạn)
"use client";

import type { Message } from "@/types/user.type";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export type AvailableUser = {
  _id: string;
  username: string;
  profilePicture?: string;
};

export type RecentChat = {
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
    checkMark: boolean;
    isOnline: boolean;
    lastActive: string;
    lastOnline: string;
  };
  lastMessage: {
    senderId: string | null;
    _id: string;
    message: string;
    isOwnMessage: boolean;
    createdAt: string;
    isRead: boolean;
  };
};

// Hàm tiện ích để lấy token từ localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

// Lấy danh sách chat gần đây
export const getRecentChats = async (): Promise<RecentChat[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  const response = await fetch(`${BASE_URL}/messenger/recent-chats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể lấy danh sách chat gần đây");
  }

  return response.json();
};

// Lấy danh sách người dùng có thể nhắn tin
export const getAvailableUsers = async (): Promise<AvailableUser[]> => {
  // Sửa lại kiểu trả về nếu API trả về mảng
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

// Lấy lịch sử tin nhắn với một người dùng cụ thể (API cũ, giữ lại nếu cần)
export const getMessages = async (
  userId: string,
  page = 1,
  limit = 20
): Promise<{
  messages: Message[];
  pagination: {
    currentPage: number;
    totalMessages: number;
    hasMore: boolean;
    messagesPerPage: number;
  };
  unreadCount: number;
}> => {
  const token = getAuthToken();
  const url = `${BASE_URL}/messenger/messages/${userId}?page=${page}&limit=${limit}`;

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

// Lấy tin nhắn với phân trang kiểu infinite scroll (dùng before, limit)
export const getMessagesWithPagination = async (
  userId: string,
  before?: string, // ISO date string hoặc undefined
  limit = 20
): Promise<{
  messages: Message[];
  hasMore: boolean;
  oldestTimestamp: string | null;
}> => {
  const token = getAuthToken();
  let url = `${BASE_URL}/messenger/getMessagesWithPagination/${userId}?limit=${limit}`;
  if (before) {
    url += `&before=${encodeURIComponent(before)}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Response lỗi:", errorText);
    throw new Error("Lỗi khi lấy tin nhắn (infinite scroll)");
  }
  return res.json();
};

// Gửi tin nhắn qua REST API
export const sendMessage = async (
  receiverId: string,
  message: string,
  file?: File,
  replyTo?: string
): Promise<{ message: Message }> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  if (file) {
    // Gửi file qua FormData
    const formData = new FormData();
    formData.append("receiverId", receiverId);
    formData.append("message", message);
    if (replyTo) formData.append("replyTo", replyTo);
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/messenger/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // KHÔNG set Content-Type ở đây!
      },
      credentials: "include",
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("File upload error response:", errorText);
      throw new Error("Không thể gửi tin nhắn (file)");
    }
    return response.json();
  } else {
    // Gửi text như cũ
    const response = await fetch(`${BASE_URL}/messenger/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        receiverId,
        message,
        ...(replyTo ? { replyTo } : {}),
      }),
    });
    if (!response.ok) {
      throw new Error("Không thể gửi tin nhắn");
    }
    return response.json();
  }
};

// Đánh dấu tin nhắn đã đọc (ĐÃ SỬA)
export const markMessagesAsRead = async (
  messageIds: string[],
  senderId: string
): Promise<void> => {
  // Hoặc Promise<{ success: boolean; message: string }> nếu bạn muốn dùng response
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  const response = await fetch(`${BASE_URL}/messenger/mark-as-read`, {
    // URL đúng
    method: "POST", // Phương thức đúng
    headers: {
      "Content-Type": "application/json", // Thêm Content-Type
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messageIds, senderId }), // Body đúng
  });

  if (!response.ok) {
    // Bạn có thể thêm log chi tiết lỗi từ server nếu muốn
    // const errorData = await response.json().catch(() => ({ message: "Lỗi không xác định" }));
    // throw new Error(errorData.message || "Không thể đánh dấu tin nhắn đã đọc");
    throw new Error("Không thể đánh dấu tin nhắn đã đọc");
  }

  // return response.json(); // Nếu bạn muốn trả về và sử dụng response từ server
  return; // Nếu chỉ cần biết thành công hay không
};

// Lấy số lượng tin nhắn chưa đọc
export const getUnreadCount = async (
  senderId: string, // id của đối phương (người gửi)
  receiverId: string // id của bạn (người nhận)
): Promise<{ unreadCount: number; message: string }> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

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
  identifier: string // có thể là userId hoặc username
): Promise<{
  success: boolean;
  userId: string;
  username: string;
  status: "online" | "offline";
  lastActive: string;
  lastOnline: string;
}> => {
  const token = getAuthToken();
  if (!token) throw new Error("Không có token xác thực");

  const response = await fetch(`${BASE_URL}/messenger/status/${identifier}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Không thể kiểm tra trạng thái người dùng");
  }

  const data = await response.json();
  if (!data || !data.success) {
    throw new Error("Phản hồi trả lời khi kiểm tra trạng thái người dùng");
  }

  return data;
};

export const createPeerConnection = async () => {
  try {
    const res = await fetch(`${BASE_URL}/ice-token`);
    if (!res.ok) {
      throw new Error("Không thể lấy ice-token");
    }

    const data = await res.json();

    const peer = new RTCPeerConnection({
      iceServers: data.iceServers,
    });

    return {
      peer,
      iceData: data,
    };
  } catch (error) {
    console.error("Lỗi lấy ICE servers:", error);
    throw error;
  }
};
