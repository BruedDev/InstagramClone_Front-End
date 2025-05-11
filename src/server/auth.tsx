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
  // Kiểm tra nếu có token trong localStorage (được lưu từ phản hồi trước đó)
  const storedToken = localStorage.getItem("auth_token");

  // Xác định xem có phải là trình duyệt WebKit hay không
  const isWebKit =
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
    /iPhone|iPad|iPod|Mac/.test(navigator.userAgent);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Nếu có token đã lưu, thêm vào header
  if (storedToken) {
    headers["X-Access-Token"] = storedToken;
    // Thêm cả vào Authorization header để đảm bảo
    headers["Authorization"] = `Bearer ${storedToken}`;
  }

  // Thêm header đánh dấu nếu là WebKit và lần đầu gọi API
  if (isWebKit && !storedToken) {
    headers["X-Webkit-Initial-Request"] = "true";
  }

  const response = await fetch(`${BASE_URL}/check`, {
    method: "GET",
    headers: headers,
    credentials: "include", // Vẫn gửi cookie nếu có thể
  });

  // Kiểm tra các header trong response
  const tokenFromHeader = response.headers.get("X-Refresh-Token");
  if (tokenFromHeader) {
    localStorage.setItem("auth_token", tokenFromHeader);
  }

  // Xử lý status code 203 (WebKit token tạm thời)
  if (response.status === 203) {
    const data = await response.json();
    if (data.token) {
      localStorage.setItem("auth_token", data.token);

      // Thực hiện gọi lại API với token mới
      return await checkAuth();
    }
  }

  if (!response.ok) {
    // Nếu lỗi 401, xóa token đã lưu
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
    }

    const errorData = await response.json();
    throw new Error(errorData.message || "Authentication check failed");
  }

  return await response.json();
};
