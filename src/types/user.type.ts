export interface GetUserResponse {
  success: boolean;
  user: User;
  message?: string;
}

export interface User {
  id: string;
  _id: string;
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
  posts?: string[];
  checkMark: boolean;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  profilePicture: string;
}

export interface DeleteAvatarResponse {
  success: boolean;
  message: string;
}

export interface UpdateBioResponse {
  success: boolean;
  message: string;
  user: {
    _id: string;
    username: string;
    bio: string;
    profilePicture?: string;
  };
}
