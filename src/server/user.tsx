// server/user.tsx
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

// Kiểu dữ liệu cho phản hồi từ API theo dõi/hủy theo dõi (toggle)
export interface ToggleFollowResponse {
  success: boolean;
  message: string;
  action: "followed" | "unfollowed"; // Trường mới cho biết hành động đã thực hiện
}

// Các kiểu dữ liệu GetFollowingResponse và GetFollowersResponse (giữ nguyên nếu đã có)
// Ví dụ, dựa trên các lần tương tác trước:
interface FollowUserInfo {
  // Bạn cần định nghĩa cấu trúc này dựa trên dữ liệu API trả về
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  checkMark: boolean;
  isPrivate: boolean;
}

export interface GetFollowingResponse {
  success: boolean;
  message: string;
  username?: string;
  fullName?: string;
  following: FollowUserInfo[];
}

export interface GetFollowersResponse {
  success: boolean;
  message: string;
  username?: string;
  fullName?: string;
  followers: FollowUserInfo[];
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

// phần theo dõi

export const followUserApi = async (
  targetUserId: string
): Promise<ToggleFollowResponse> => {
  try {
    const token = localStorage.getItem("authToken");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/follow/${targetUserId}`, {
      method: "PUT",
      headers,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Yêu cầu theo dõi/hủy theo dõi thất bại."
      );
    }

    // ✅ Giả định server trả về { success, message, action, followUser }
    return data as ToggleFollowResponse;
  } catch (error) {
    console.error(
      `Lỗi khi thực hiện hành động theo dõi/hủy theo dõi cho user ${targetUserId}:`,
      error
    );
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      "Lỗi không xác định phía client khi thực hiện theo dõi/hủy theo dõi."
    );
  }
};

export const getFollowingApi = async (
  userId: string
): Promise<GetFollowingResponse> => {
  try {
    const token = localStorage.getItem("authToken");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/following/${userId}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => {
        return {
          message: "Phản hồi từ server không phải JSON hoặc có lỗi mạng.",
        };
      });
      throw new Error(
        errorData.message || "Không thể lấy danh sách đang theo dõi"
      );
    }

    return (await response.json()) as GetFollowingResponse;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đang theo dõi:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      "Lỗi không xác định phía client khi lấy danh sách đang theo dõi."
    );
  }
};

export const getFollowersApi = async (
  userId: string
): Promise<GetFollowersResponse> => {
  try {
    const token = localStorage.getItem("authToken");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/followers/${userId}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => {
        return {
          message: "Phản hồi từ server không phải JSON hoặc có lỗi mạng.",
        };
      });
      throw new Error(
        errorData.message || "Không thể lấy danh sách người theo dõi"
      );
    }

    return (await response.json()) as GetFollowersResponse;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người theo dõi:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      "Lỗi không xác định phía client khi lấy danh sách người theo dõi."
    );
  }
};
