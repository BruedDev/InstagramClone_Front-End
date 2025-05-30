export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface GoogleAuthPayload {
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

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  cookieSet?: boolean;
  user?: User;
}
