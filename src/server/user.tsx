// server/user.ts
import { GetUserResponse } from "@/types/user.type";
import {
  UploadAvatarResponse,
  DeleteAvatarResponse,
  UpdateBioResponse,
  SuggestUsersResponse,
} from "@/types/user.type";

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/user`;

export const getUser = async (
  identifier: string // Can be userId or username
): Promise<GetUserResponse> => {
  try {
    // Only access localStorage on the client side
    let token = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("authToken");
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/getUser/${identifier}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Không thể lấy thông tin người dùng"
      );
    }

    const data = await response.json();
    return data; // Return the entire response which contains the user object
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    throw error;
  }
};

export const deleteUser = async (
  userId: string
): Promise<DeleteUserResponse> => {
  try {
    const token = localStorage.getItem("authToken");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/deleteUser/${userId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xóa người dùng thất bại");
    }

    // Xóa localStorage nếu là người dùng hiện tại
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (currentUser?.id === userId) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }

    return (await response.json()) as DeleteUserResponse;
  } catch (error) {
    console.error("Lỗi khi xóa người dùng:", error);
    throw error;
  }
};

export const uploadAvatar = async (
  file: File
): Promise<UploadAvatarResponse> => {
  try {
    const token = localStorage.getItem("authToken");

    const formData = new FormData();
    formData.append("file", file);

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${BASE_URL}/uploadAvatar`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Tải ảnh đại diện thất bại");
    }

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      profilePicture: data.profilePicture,
    };
  } catch (error) {
    console.error("Lỗi khi tải ảnh đại diện:", error);
    throw error;
  }
};

export const deleteAvatar = async (): Promise<DeleteAvatarResponse> => {
  try {
    const token = localStorage.getItem("authToken");

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${BASE_URL}/deleteAvatar`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xóa ảnh đại diện thất bại");
    }

    return (await response.json()) as DeleteAvatarResponse;
  } catch (error) {
    console.error("Lỗi khi xóa ảnh đại diện:", error);
    throw error;
  }
};

export const updateBio = async (bio: string): Promise<UpdateBioResponse> => {
  try {
    const token = localStorage.getItem("authToken");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/updateBio`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ bio }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Cập nhật bio thất bại");
    }

    const data = await response.json();
    return data as UpdateBioResponse;
  } catch (error) {
    console.error("Lỗi khi cập nhật bio:", error);
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
