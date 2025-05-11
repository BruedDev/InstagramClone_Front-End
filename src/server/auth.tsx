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

// Constants for Apple platform workaround
const COOKIE_NAME = "auth_user_data";
const COOKIE_EXPIRY = 5 * 60 * 1000; // 5 phút

// Function to detect macOS or iOS
const isApplePlatform = (): boolean => {
  if (typeof window === "undefined") return false; // SSR check

  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("mac") ||
    userAgent.includes("iphone") ||
    userAgent.includes("ipad") ||
    userAgent.includes("ipod")
  );
};

// Function to set a cookie with expiration
const setCookie = (name: string, value: string, expiry: number): void => {
  if (typeof document === "undefined") return; // SSR check

  const date = new Date();
  date.setTime(date.getTime() + expiry);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
};

// Function to get a cookie by name
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null; // SSR check

  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
};

// Function to refresh Apple platform cookie
const refreshApplePlatformCookie = (userData: User): void => {
  setCookie(COOKIE_NAME, JSON.stringify(userData), COOKIE_EXPIRY);

  // Set timeout to refresh the cookie before it expires
  setTimeout(() => {
    const existingUserData = getCookie(COOKIE_NAME);
    if (existingUserData) {
      refreshApplePlatformCookie(JSON.parse(existingUserData));
    }
  }, COOKIE_EXPIRY - 30000); // Refresh 30 seconds before expiry
};

// Đăng nhập
export const login = async (data: LoginPayload): Promise<User> => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include", // Gửi cookie (session)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }

  const userData = await response.json();

  // Xử lý riêng cho thiết bị Apple
  if (isApplePlatform() && userData) {
    refreshApplePlatformCookie(userData);
  }

  return userData;
};

// Đăng ký
export const register = async (data: RegisterPayload): Promise<User> => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Registration failed");
  }

  const userData = await response.json();

  // Xử lý riêng cho thiết bị Apple
  if (isApplePlatform() && userData) {
    refreshApplePlatformCookie(userData);
  }

  return userData;
};

// Đăng xuất
export const logout = async (): Promise<{ message: string }> => {
  // Xóa cookie nếu đang ở thiết bị Apple
  if (isApplePlatform()) {
    document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }

  const response = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Facebook login failed");
  }

  const userData = await response.json();

  // Xử lý riêng cho thiết bị Apple
  if (isApplePlatform() && userData) {
    refreshApplePlatformCookie(userData);
  }

  return userData;
};

// Kiểm tra xác thực
export const checkAuth = async (): Promise<User | null> => {
  // Kiểm tra cookie cho thiết bị Apple
  if (isApplePlatform()) {
    const userCookie = getCookie(COOKIE_NAME);
    if (userCookie) {
      try {
        const userData: User = JSON.parse(userCookie);
        return userData;
      } catch (error) {
        console.error("Error parsing user cookie:", error);
      }
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/check`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null; // Không ném lỗi, chỉ trả về null khi không xác thực được
    }

    const userData = await response.json();

    // Lưu cookie cho thiết bị Apple
    if (isApplePlatform() && userData) {
      refreshApplePlatformCookie(userData);
    }

    return userData;
  } catch (error) {
    console.error("Authentication check error:", error);
    return null;
  }
};
