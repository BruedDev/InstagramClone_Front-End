export interface GetUserResponse {
  success: boolean;
  user: User;
  message?: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: number;
  profilePicture: string;
  bio: string;
  followers: number[];
  following: number[];
  isPrivate: boolean;
  authType: string;
  createdAt: string;
  updatedAt: string;
  post: number[];
}