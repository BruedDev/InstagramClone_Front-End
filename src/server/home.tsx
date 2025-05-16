// server/home.ts
import { getAuthToken } from "./auth";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/home`;

export const getHomePosts = async () => {
  try {
    const token = getAuthToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/getPostHome`, {
      method: "GET",
      headers,
      credentials: "include", // đảm bảo cookie (nếu có) được gửi kèm
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể tải bài viết");
    }

    const data = await response.json();
    return data.posts; // vì trong controller bạn trả về { success, posts }
  } catch (error) {
    console.error("Lỗi khi lấy bài viết trang chủ:", error);
    throw error;
  }
};
