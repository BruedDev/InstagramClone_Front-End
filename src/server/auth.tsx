// server/auth.ts
import {
  LoginPayload,
  RegisterPayload,
  GoogleAuthPayload,
  User,
  AuthResponse,
} from "@/types/auth.type";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/auth`;

// Hàm lưu token trong localStorage khi cookies bị chặn
const handleTokenStorage = (response: AuthResponse): void => {
  if (response.success && response.token && response.cookieSet) {
    localStorage.setItem("authToken", response.token);
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
    credentials: "include",
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
