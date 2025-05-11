// server/auth.ts

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/auth`;

interface LoginPayload {
  identifier: string;
  password: string;
}

interface RegisterPayload {
  username: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  password: string;
}

// Interface cho Google Auth
interface GoogleAuthPayload {
  tokenId: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePicture: string;
  bio: string;
  followers: string[];
  following: string[];
  isPrivate: boolean;
  authType: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  cookieSet?: boolean;
  user?: User;
}

// Hàm lưu token trong localStorage khi cookies bị chặn
const handleTokenStorage = (response: AuthResponse): void => {
  if (response.success && response.token && response.cookieSet) {
    // Lưu token vào localStorage như là phương án dự phòng
    localStorage.setItem("authToken", response.token);
  }
};

// Hàm xử lý token từ URL (dùng cho redirect sau khi đăng nhập Facebook)
export const handleAuthFromURL = (): void => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const cookieSet = urlParams.get("cookieSet");

    if (token && cookieSet === "true") {
      // Lưu token vào localStorage
      localStorage.setItem("authToken", token);

      // Xóa token và cookieSet khỏi URL để bảo mật
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.searchParams.delete("cookieSet");

      // Cập nhật URL mà không làm tải lại trang
      window.history.replaceState({}, document.title, url.toString());
    }
  }
};

// Hàm lấy token từ localStorage (dùng khi cookies bị chặn)
const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

// Hàm tạo headers với token nếu cần
const createAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Đăng nhập
export const login = async (data: LoginPayload): Promise<User> => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(data),
    credentials: "include", // Vẫn cố gắng gửi cookie
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }

  const responseData = (await response.json()) as AuthResponse;
  handleTokenStorage(responseData);

  return responseData.user as User;
};

// Đăng ký
export const register = async (data: RegisterPayload): Promise<User> => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Registration failed");
  }

  const responseData = (await response.json()) as AuthResponse;
  handleTokenStorage(responseData);

  return responseData.user as User;
};

// Đăng xuất
export const logout = async (): Promise<{ message: string }> => {
  // Xóa token trong localStorage khi đăng xuất
  localStorage.removeItem("authToken");

  const response = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: createAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Logout failed");
  }

  return await response.json();
};

// Đăng nhập Facebook
export const facebookLogin = async (data: {
  accessToken: string;
  userID: string;
  name: string;
  email: string;
}): Promise<User> => {
  const response = await fetch(`${BASE_URL}/facebook/login`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Facebook login failed");
  }

  const responseData = (await response.json()) as AuthResponse;
  handleTokenStorage(responseData);

  return responseData.user as User;
};

// Đăng nhập Google
export const googleLogin = async (data: GoogleAuthPayload): Promise<User> => {
  const response = await fetch(`${BASE_URL}/google`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Google login failed");
  }

  const responseData = (await response.json()) as AuthResponse;
  handleTokenStorage(responseData);

  return responseData.user as User;
};

// Kiểm tra xác thực
export const checkAuth = async (): Promise<User | null> => {
  const response = await fetch(`${BASE_URL}/check`, {
    method: "GET",
    headers: createAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Authentication check failed");
  }

  const responseData = (await response.json()) as AuthResponse;
  handleTokenStorage(responseData);

  return responseData.user as User;
};
