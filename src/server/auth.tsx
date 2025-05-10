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

  return await response.json();
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

  return await response.json();
};

// Đăng xuất
export const logout = async (): Promise<{ message: string }> => {
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

  return await response.json();
};

// Kiểm tra xác thực
export const checkAuth = async (): Promise<User | null> => {
  const response = await fetch(`${BASE_URL}/check`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Authentication check failed");
  }

  return await response.json();
};
