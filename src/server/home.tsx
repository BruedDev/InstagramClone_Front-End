// server/home.ts
import { getAuthToken } from "./auth";
import { SuggestUsersResponse } from "@/types/user.type";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/home`;

export const getHomePosts = async (page = 1, limit = 10) => {
  try {
    const token = getAuthToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${BASE_URL}/getPostHome?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers,
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể tải bài viết");
    }

    const data = await response.json();
    return data; // Trả về { posts, total, hasMore, page, limit }
  } catch (error) {
    console.error("Lỗi khi lấy bài viết trang chủ:", error);
    throw error;
  }
};

export const suggestUsers = async (): Promise<SuggestUsersResponse> => {
  try {
    const token = localStorage.getItem("authToken");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/suggestUsers`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể lấy danh sách gợi ý");
    }

    const data = await response.json();
    return data as SuggestUsersResponse;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách gợi ý người dùng:", error);
    throw error;
  }
};

// Lấy stories cho trang chủ
export const getStoryHome = async () => {
  try {
    const token = getAuthToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/getStoryHome`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể tải stories");
    }

    const data = await response.json();
    return data.stories; // vì trong controller trả về { success, stories }
  } catch (error) {
    console.error("Lỗi khi lấy stories trang chủ:", error);
    throw error;
  }
};

// Tạo story mới
export const createStory = async (formData: FormData) => {
  try {
    const token = getAuthToken();

    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Không set Content-Type cho FormData, browser sẽ tự động set với boundary
    const response = await fetch(`${BASE_URL}/createStory`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể tạo story");
    }

    const data = await response.json();
    return data; // trả về { success, message, story }
  } catch (error) {
    console.error("Lỗi khi tạo story:", error);
    throw error;
  }
};
