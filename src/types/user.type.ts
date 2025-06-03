export interface GetUserResponse {
  success: boolean;
  user: User;
  message?: string;

}

export interface User {
  id: string;
  _id: string;
  username: string ;
  fullName: string;
  email: string;
  phoneNumber: number;
  profilePicture: string;
  bio: string;
  followers: string[];
  following: string[];
  isPrivate: boolean;
  authType: string;
  createdAt: string;
  updatedAt: string;
  posts?: string[];
  checkMark: boolean;
  currentUserId?: string;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  lastActive?: number | string | null;
  lastOnline?: number | string | null;
  lastActiveTime?: string;
  lastOnlineTime?: string;
  hasStories?: boolean;
}

export interface Message {
  id: string;
  _id: string;
  content: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  message: string;
  replyTo?: string | null;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  isOwnMessage?: boolean;
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

export interface SuggestedUser {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark: boolean;
  // thêm các trường khác nếu cần
}

export interface SuggestUsersResponse {
  success: boolean;
  users: SuggestedUser[];
}