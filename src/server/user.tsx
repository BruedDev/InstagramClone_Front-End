// server/user.ts

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/user`;

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
