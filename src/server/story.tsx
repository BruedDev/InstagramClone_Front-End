import { getAuthToken } from "./auth";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/story`;

export const getStoriesByUser = async (userIdOrUsername: string) => {
  try {
    const token = getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${BASE_URL}/getStoryId/${userIdOrUsername}`, {
      method: "GET",
      headers,
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể lấy stories của user");
    }
    const data = await response.json();
    return data.stories;
  } catch (error) {
    console.error("Lỗi khi lấy stories theo user:", error);
    throw error;
  }
};
